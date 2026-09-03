/**
 * Follow-up reminders for one-off admin→customer SMS messages
 * (sent from an order's SMS thread in the admin panel, outside the
 * automated review-request flow).
 *
 * Runs on a cron schedule. For any logged message sent 24+ hours ago with
 * no reminder sent yet, checks Twilio for an inbound reply from that
 * customer since the message went out — if they've replied, no reminder is
 * needed; if not, sends one generic follow-up nudge.
 */

import { db } from "./db";
import { customerSmsLog } from "@shared/schema";
import { and, eq, isNull, lte } from "drizzle-orm";
import { sendSMS } from "./sms";

async function hasCustomerRepliedSince(customerPhone: string, since: Date): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const ourNumber = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !ourNumber) return false;

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const params = new URLSearchParams({
      From: customerPhone,
      To: ourNumber,
      PageSize: "20",
    });
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json?${params}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!resp.ok) return false;
    const data = (await resp.json()) as any;
    const messages = (data.messages || []) as any[];
    return messages.some((m) => new Date(m.date_created).getTime() > since.getTime());
  } catch (err: any) {
    console.error(`[CustomerSmsReminder] Twilio reply check failed for ${customerPhone}: ${err.message}`);
    return false; // fail safe — don't block a reminder just because the check errored
  }
}

function buildFollowUpSmsBody(name: string | null): string {
  return `Hi ${name || "there"}, just following up on our previous message — let us know if you have any questions! – 1stRep`;
}

export async function processCustomerSmsReminders(): Promise<void> {
  console.log("[CustomerSmsReminder] Checking for unanswered manual SMS messages...");

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const candidates = await db
      .select()
      .from(customerSmsLog)
      .where(
        and(
          lte(customerSmsLog.sentAt, oneDayAgo),
          isNull(customerSmsLog.reminderSentAt),
          isNull(customerSmsLog.customerRepliedAt)
        )
      )
      .limit(50); // Safety cap — process at most 50 per run

    if (candidates.length === 0) {
      console.log("[CustomerSmsReminder] No eligible messages found.");
      return;
    }

    console.log(`[CustomerSmsReminder] Found ${candidates.length} message(s) to process.`);

    for (const row of candidates) {
      try {
        const replied = await hasCustomerRepliedSince(row.customerPhone, row.sentAt);
        if (replied) {
          await db
            .update(customerSmsLog)
            .set({ customerRepliedAt: new Date() })
            .where(eq(customerSmsLog.id, row.id));
          console.log(`[CustomerSmsReminder] ${row.customerPhone} already replied — skipping reminder`);
          continue;
        }

        const body = buildFollowUpSmsBody(row.customerFirstName);
        const sent = await sendSMS(row.customerPhone, body, (message) => {
          console.error(`[CustomerSmsReminder] SMS failed for log ${row.id}: ${message}`);
        });

        if (sent) {
          console.log(`[CustomerSmsReminder] Reminder sent to ${row.customerPhone} — log ${row.id}`);
          await db
            .update(customerSmsLog)
            .set({ reminderSentAt: new Date() })
            .where(eq(customerSmsLog.id, row.id));
        }
      } catch (err: any) {
        console.error(`[CustomerSmsReminder] Failed for log ${row.id}: ${err.message}`);
      }
    }

    console.log("[CustomerSmsReminder] Run complete.");
  } catch (err: any) {
    console.error("[CustomerSmsReminder] Fatal error during run:", err);
  }
}
