/**
 * Real sending for admin "Marketing & CRM" email campaigns.
 *
 * Before this, the Send button only wrote "sent" rows into the database; no email was ever delivered.
 *
 *  - Audience: a chosen segment, otherwise everyone we may legitimately market to (same rule as the weekly email:
 *    anyone with a PAID order incl. guests, plus active newsletter subscribers, minus everyone who unsubscribed).
 *  - One copy per person, never twice: every send is logged per campaign + email (campaign_send_log), so a
 *    restart, a second click or a retry can only ever continue where it stopped.
 *  - Each email gets an unsubscribe link in the body and the one-click List-Unsubscribe header.
 *  - Paced (about one a second) and stops itself if the mail server starts refusing mail.
 *  - {{firstName}}, {{lastName}}, {{email}} are filled in per person.
 */
import { db } from "./db";
import { sql } from "drizzle-orm";
import { sendEmail } from "./email";
import { getWeeklyRecipients, buildUnsubscribeUrl, buildOneClickUnsubscribeUrl } from "./weeklyEmailService";

export interface Recipient { email: string; firstName: string | null; lastName?: string | null }

export async function ensureCampaignSendLog() {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS campaign_send_log (
    campaign_id VARCHAR NOT NULL, email TEXT NOT NULL, status TEXT NOT NULL, error TEXT, attempts INTEGER NOT NULL DEFAULT 1,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (campaign_id, email))`);
}

const properName = (raw: string | null | undefined) => {
  const v = (raw || "").trim();
  return v && v === v.toUpperCase() ? v.toLowerCase().split(/([\s'-]+)/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("") : v;
};

// The campaign form stores "All subscribers" as the word "all" (or nothing): that means no segment.
const realSegment = (id?: string | null) => (id && id !== "all" ? id : null);

export async function getCampaignRecipients(campaign: { segmentId?: string | null }): Promise<Recipient[]> {
  let list: Recipient[];
  const segmentId = realSegment(campaign.segmentId);
  if (segmentId) {
    const rows = (await db.execute(sql`
      SELECT lower(trim(u.email)) AS email, u.first_name AS "firstName", u.last_name AS "lastName"
        FROM customer_segment_members m JOIN users u ON u.id = m.user_id
       WHERE m.segment_id = ${segmentId} AND u.email IS NOT NULL`)).rows as any[];
    list = rows;
  } else {
    list = (await getWeeklyRecipients()).map((r) => ({ email: r.email, firstName: r.firstName }));
  }
  // always drop unsubscribed + invalid + internal addresses, whichever audience was chosen
  const unsub = new Set(((await db.execute(sql`SELECT lower(trim(email)) AS e FROM email_unsubscribes UNION SELECT lower(trim(email)) FROM newsletter_subscriptions WHERE unsubscribed_at IS NOT NULL`)).rows as any[]).map((r) => r.e));
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const r of list) {
    const e = (r.email || "").toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || e.endsWith("@epos.local") || e.endsWith("@1strep.internal") || unsub.has(e) || seen.has(e)) continue;
    seen.add(e);
    out.push({ email: e, firstName: r.firstName, lastName: r.lastName });
  }
  return out;
}

function personalise(html: string, r: Recipient): string {
  const first = properName(r.firstName) || "there";
  const withVars = html
    .replace(/\{\{\s*firstName\s*\}\}/gi, first)
    .replace(/\{\{\s*lastName\s*\}\}/gi, properName(r.lastName))
    .replace(/\{\{\s*email\s*\}\}/gi, r.email);
  if (/unsubscribe/i.test(withVars)) return withVars.replace(/\{\{\s*unsubscribe(Url|_url)?\s*\}\}/gi, buildUnsubscribeUrl(r.email));
  const link = buildUnsubscribeUrl(r.email);
  const footer = `<div style="max-width:600px;margin:24px auto 0;padding:16px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#777">You are receiving this because you shopped with, or signed up to, 1stRep. <a href="${link}" style="color:#777;text-decoration:underline">Unsubscribe</a></div>`;
  return /<\/body>/i.test(withVars) ? withVars.replace(/<\/body>/i, footer + "</body>") : withVars + footer;
}

async function sendOne(subject: string, html: string, r: Recipient): Promise<boolean> {
  return sendEmail(r.email, subject, personalise(html, r), {
    headers: { "List-Unsubscribe": `<${buildOneClickUnsubscribeUrl(r.email)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
}

export async function sendCampaignTest(campaignId: string, toEmail: string): Promise<boolean> {
  const c: any = (await db.execute(sql`SELECT subject, html_content FROM email_campaigns WHERE id = ${campaignId}`)).rows[0];
  if (!c) throw new Error("Campaign not found");
  return sendOne(`[TEST] ${c.subject}`, c.html_content, { email: toEmail.trim().toLowerCase(), firstName: "Test" });
}

const running = new Set<string>();

/** Starts (or continues) the real send in the background. Safe to call twice. */
export async function startCampaignSend(campaignId: string): Promise<{ started: boolean; recipients: number; alreadySent: number; reason?: string }> {
  await ensureCampaignSendLog();
  const c: any = (await db.execute(sql`SELECT id, subject, html_content, segment_id, status FROM email_campaigns WHERE id = ${campaignId}`)).rows[0];
  if (!c) return { started: false, recipients: 0, alreadySent: 0, reason: "Campaign not found" };
  if (c.status === "sent" || c.status === "cancelled") return { started: false, recipients: 0, alreadySent: 0, reason: `This campaign is already ${c.status}` };
  if (running.has(campaignId)) return { started: false, recipients: 0, alreadySent: 0, reason: "This campaign is already sending" };

  const claim: any = await db.execute(sql`UPDATE email_campaigns SET status = 'sending', updated_at = NOW() WHERE id = ${campaignId} AND status IN ('draft','scheduled','sending','paused')`);
  if (!claim.rowCount) return { started: false, recipients: 0, alreadySent: 0, reason: "Could not start" };

  const recipients = await getCampaignRecipients({ segmentId: c.segment_id });
  const done = new Set(((await db.execute(sql`SELECT email FROM campaign_send_log WHERE campaign_id = ${campaignId} AND (status = 'sent' OR attempts >= 3)`)).rows as any[]).map((r) => r.email));
  const todo = recipients.filter((r) => !done.has(r.email));
  await db.execute(sql`UPDATE email_campaigns SET total_recipients = ${recipients.length} WHERE id = ${campaignId}`);

  running.add(campaignId);
  (async () => {
    let consecutiveFailures = 0, aborted = false;
    try {
      for (const r of todo) {
        let ok = false, err: string | null = null;
        try { ok = await sendOne(c.subject, c.html_content, r); if (!ok) err = "send returned false"; } catch (e: any) { err = String(e?.message || e).slice(0, 300); }
        await db.execute(sql`INSERT INTO campaign_send_log (campaign_id, email, status, error) VALUES (${campaignId}, ${r.email}, ${ok ? "sent" : "failed"}, ${err})
          ON CONFLICT (campaign_id, email) DO UPDATE SET status = EXCLUDED.status, error = EXCLUDED.error, attempts = campaign_send_log.attempts + 1, sent_at = NOW()`);
        consecutiveFailures = ok ? 0 : consecutiveFailures + 1;
        if (consecutiveFailures >= 5) { aborted = true; console.error("[Campaign] 5 failures in a row - mail server refusing mail. Pausing."); break; }
        await new Promise((res) => setTimeout(res, 1100));
      }
    } finally {
      const sentCount = Number(((await db.execute(sql`SELECT count(*) n FROM campaign_send_log WHERE campaign_id = ${campaignId} AND status = 'sent'`)).rows[0] as any).n);
      await db.execute(sql`UPDATE email_campaigns SET status = ${aborted ? "paused" : "sent"}::campaign_status, total_sent = ${sentCount}, total_delivered = ${sentCount}, sent_at = CASE WHEN ${aborted} THEN sent_at ELSE NOW() END, updated_at = NOW() WHERE id = ${campaignId}`);
      running.delete(campaignId);
      console.log(`[Campaign] ${campaignId}: ${sentCount}/${recipients.length} sent${aborted ? " (PAUSED, press send again to continue)" : ""}`);
    }
  })().catch((e) => console.error("[Campaign] send loop crashed:", e));

  return { started: true, recipients: recipients.length, alreadySent: recipients.length - todo.length };
}

/** If the server restarted mid-send, pick the sending campaigns up again (the log stops anyone getting a second copy). */
export async function resumeInterruptedCampaigns() {
  try {
    await ensureCampaignSendLog();
    const rows = (await db.execute(sql`SELECT id FROM email_campaigns WHERE status = 'sending'`)).rows as any[];
    for (const r of rows) { console.log("[Campaign] resuming interrupted send", r.id); await startCampaignSend(r.id); }
  } catch (e) { console.error("[Campaign] resume failed:", e); }
}
