/**
 * Post-Delivery Review Request Service
 *
 * Runs on a cron schedule. Finds all customer orders that:
 *  - have status = 'delivered'
 *  - were delivered 3 or more days ago
 *  - have not yet had a review request email sent
 *
 * Sends a branded (v1.9 monochrome) email and records the send time on the order.
 */

import { db } from "./db";
import { customerOrders } from "@shared/schema";
import { and, eq, isNull, lte, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Re-use the project's existing Gmail/SMTP send pipeline
// sendEmailViaGmail is not exported — we import the higher-level helper
// that already handles SMTP-first → Gmail fallback
import { sendDeliveryConfirmation } from "./email-service";

// ---------------------------------------------------------------------------
// Email template
// ---------------------------------------------------------------------------

const getSiteUrl = () => "https://1strep.com";

function buildReviewEmailHtml(params: {
  firstName: string;
  orderNumber: string;
  feedbackUrl: string;
}): string {
  const { firstName, orderNumber, feedbackUrl } = params;
  const siteUrl = getSiteUrl();

  // Encode star URLs with a pre-selected rating so clicking a star
  // takes the customer straight to the feedback page with that rating applied
  const starUrl = (rating: number) =>
    `${feedbackUrl}&rating=${rating}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rate your 1stRep order — ${orderNumber}</title>
</head>
<body style="margin:0; padding:0; background-color:#080808; font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; -webkit-font-smoothing:antialiased;">

  <!-- Pre-header (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Your kit has arrived — tell us what you think, ${firstName}. It only takes 30 seconds.&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080808; padding:48px 16px;">
    <tr>
      <td align="center">

        <!-- ─── Card ─────────────────────────────────────────────── -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

          <!-- Logo bar -->
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <a href="${siteUrl}" style="text-decoration:none;">
                <img src="https://1strep.com/1strep-header-logo.png" alt="1stRep" width="110" height="auto" style="display:block; border:0;" />
              </a>
            </td>
          </tr>

          <!-- Hero block -->
          <tr>
            <td style="background:#0F0F0F; border:1px solid #1E1E1E; border-radius:6px 6px 0 0; padding:48px 48px 0;">

              <!-- Eyebrow pill -->
              <p style="display:inline-block; margin:0 0 24px; padding:5px 14px; background:#1A1A1A; border:1px solid #2A2A2A; border-radius:100px; font-size:11px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#8A8A8A;">
                Order ${orderNumber}
              </p>

              <!-- Headline -->
              <h1 style="margin:0 0 16px; font-size:30px; font-weight:800; line-height:1.15; color:#FAFAF8; letter-spacing:-0.02em;">
                How did your kit<br />measure up?
              </h1>

              <!-- Subtext -->
              <p style="margin:0 0 36px; font-size:15px; line-height:1.7; color:#888888;">
                Hi ${firstName}, your order arrived a few days ago. Whether it's the fit, the quality, or how it holds up in training — your honest take matters to us and helps fellow athletes make the right call.
              </p>

            </td>
          </tr>

          <!-- Star rating row -->
          <tr>
            <td style="background:#0F0F0F; border-left:1px solid #1E1E1E; border-right:1px solid #1E1E1E; padding:32px 48px;">

              <p style="margin:0 0 20px; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#5A5A5A; text-align:center;">
                Tap a star to rate your experience
              </p>

              <!-- Stars -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 6px;">
                    <a href="${starUrl(1)}" style="text-decoration:none; font-size:40px; color:#3A3A3A; display:block; line-height:1;" title="1 star">&#9733;</a>
                  </td>
                  <td style="padding:0 6px;">
                    <a href="${starUrl(2)}" style="text-decoration:none; font-size:40px; color:#3A3A3A; display:block; line-height:1;" title="2 stars">&#9733;</a>
                  </td>
                  <td style="padding:0 6px;">
                    <a href="${starUrl(3)}" style="text-decoration:none; font-size:40px; color:#3A3A3A; display:block; line-height:1;" title="3 stars">&#9733;</a>
                  </td>
                  <td style="padding:0 6px;">
                    <a href="${starUrl(4)}" style="text-decoration:none; font-size:40px; color:#3A3A3A; display:block; line-height:1;" title="4 stars">&#9733;</a>
                  </td>
                  <td style="padding:0 6px;">
                    <a href="${starUrl(5)}" style="text-decoration:none; font-size:40px; color:#3A3A3A; display:block; line-height:1;" title="5 stars">&#9733;</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:8px; text-align:center;">
                    <a href="${starUrl(1)}" style="text-decoration:none; font-size:10px; color:#444444; letter-spacing:0.06em; text-transform:uppercase; display:block;">Poor</a>
                  </td>
                  <td></td>
                  <td style="padding-top:8px; text-align:center;">
                    <a href="${starUrl(3)}" style="text-decoration:none; font-size:10px; color:#444444; letter-spacing:0.06em; text-transform:uppercase; display:block;">Good</a>
                  </td>
                  <td></td>
                  <td style="padding-top:8px; text-align:center;">
                    <a href="${starUrl(5)}" style="text-decoration:none; font-size:10px; color:#444444; letter-spacing:0.06em; text-transform:uppercase; display:block;">Excellent</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Divider row -->
          <tr>
            <td style="background:#0F0F0F; border-left:1px solid #1E1E1E; border-right:1px solid #1E1E1E; padding:0 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 64px;"><hr style="border:none; border-top:1px solid #1E1E1E; margin:0;" /></td>
                  <td style="text-align:center; white-space:nowrap; padding:0 12px; font-size:11px; color:#3A3A3A; letter-spacing:0.08em; text-transform:uppercase;">or</td>
                  <td style="padding:0 64px;"><hr style="border:none; border-top:1px solid #1E1E1E; margin:0;" /></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA block -->
          <tr>
            <td style="background:#0F0F0F; border-left:1px solid #1E1E1E; border-right:1px solid #1E1E1E; padding:24px 48px 48px; text-align:center;">

              <p style="margin:0 0 20px; font-size:13px; line-height:1.6; color:#5A5A5A;">
                Write a full review with photos, fit notes, and more
              </p>

              <!-- Primary CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="background:#FFFFFF; border-radius:4px;">
                    <a href="${feedbackUrl}" style="display:inline-block; padding:15px 40px; font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#080808; text-decoration:none;">
                      Write a Review
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Trust strip -->
          <tr>
            <td style="background:#0A0A0A; border:1px solid #1E1E1E; border-top:1px solid #141414; border-radius:0 0 6px 6px; padding:28px 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <!-- Stat 1 -->
                  <td width="33%" style="text-align:center; padding:0 8px;">
                    <p style="margin:0 0 4px; font-size:22px; font-weight:800; color:#FAFAF8; letter-spacing:-0.02em;">30s</p>
                    <p style="margin:0; font-size:11px; color:#505050; letter-spacing:0.06em; text-transform:uppercase;">to complete</p>
                  </td>
                  <!-- Divider -->
                  <td width="1" style="background:#1E1E1E;">&nbsp;</td>
                  <!-- Stat 2 -->
                  <td width="33%" style="text-align:center; padding:0 8px;">
                    <p style="margin:0 0 4px; font-size:22px; font-weight:800; color:#FAFAF8; letter-spacing:-0.02em;">100%</p>
                    <p style="margin:0; font-size:11px; color:#505050; letter-spacing:0.06em; text-transform:uppercase;">honest, unfiltered</p>
                  </td>
                  <!-- Divider -->
                  <td width="1" style="background:#1E1E1E;">&nbsp;</td>
                  <!-- Stat 3 -->
                  <td width="33%" style="text-align:center; padding:0 8px;">
                    <p style="margin:0 0 4px; font-size:22px; font-weight:800; color:#FAFAF8; letter-spacing:-0.02em;">1K+</p>
                    <p style="margin:0; font-size:11px; color:#505050; letter-spacing:0.06em; text-transform:uppercase;">reviews left</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shop new arrivals nudge -->
          <tr>
            <td style="padding:28px 0 0; text-align:center;">
              <p style="margin:0; font-size:13px; color:#444444;">
                Spotted something new?
                <a href="${siteUrl}/shop" style="color:#8A8A8A; text-decoration:underline; text-underline-offset:3px;">Shop the latest drops &rarr;</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0; text-align:center;">
              <p style="margin:0 0 8px; font-size:11px; color:#2E2E2E; line-height:1.6;">
                &copy; ${new Date().getFullYear()} 1stRep Ltd. &nbsp;|&nbsp; Registered in England &amp; Wales<br />
                You received this because you placed an order with us.
              </p>
              <p style="margin:0; font-size:11px; color:#2E2E2E;">
                <a href="${siteUrl}/account" style="color:#3E3E3E; text-decoration:underline; text-underline-offset:3px;">Email preferences</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="${siteUrl}/privacy" style="color:#3E3E3E; text-decoration:underline; text-underline-offset:3px;">Privacy policy</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Internals — send one email and mark the order
// ---------------------------------------------------------------------------

async function sendReviewEmail(order: {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerFirstName: string;
}): Promise<void> {
  const siteUrl = getSiteUrl();
  const feedbackUrl = `${siteUrl}/feedback?order=${encodeURIComponent(order.orderNumber)}`;

  const subject = `${order.customerFirstName}, how did your kit measure up? ⭐`;
  const html = buildReviewEmailHtml({
    firstName: order.customerFirstName,
    orderNumber: order.orderNumber,
    feedbackUrl,
  });

  // Use the project's send pipeline (SMTP → Gmail fallback)
  // We import the Gmail sender directly from the internal module
  const { default: nodemailer } = await import("nodemailer");
  const { google } = await import("googleapis");

  let sent = false;

  // Attempt SMTP first
  const smtpPass = process.env.SMTP_PASSWORD;
  if (smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.123-reg.co.uk",
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: true,
        auth: {
          user: process.env.SMTP_USER || "info@1strep.com",
          pass: smtpPass,
        },
      });
      await transporter.sendMail({
        from: `"1stRep" <${process.env.SMTP_USER || "info@1strep.com"}>`,
        to: order.customerEmail,
        subject,
        html,
      });
      sent = true;
      console.log(`[ReviewRequest] SMTP sent to ${order.customerEmail} — order ${order.orderNumber}`);
    } catch (err: any) {
      console.warn(`[ReviewRequest] SMTP failed (${err.message}), trying Gmail API`);
    }
  }

  // Fallback: Gmail API via Replit connector
  if (!sent) {
    try {
      const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
      const xReplitToken = process.env.REPL_IDENTITY
        ? "repl " + process.env.REPL_IDENTITY
        : process.env.WEB_REPL_RENEWAL
        ? "depl " + process.env.WEB_REPL_RENEWAL
        : null;

      if (!hostname || !xReplitToken) throw new Error("Gmail connector env vars not set");

      const resp = await fetch(
        `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=google-mail`,
        { headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken } }
      );
      const data = await resp.json();
      const conn = data.items?.[0];
      const accessToken =
        conn?.settings?.access_token ||
        conn?.settings?.oauth?.credentials?.access_token;
      if (!accessToken) throw new Error("No Gmail access token");

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
      const messageParts = [
        `From: "1stRep" <info@1strep.com>`,
        `To: ${order.customerEmail}`,
        `Subject: ${utf8Subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        html,
      ];
      const message = messageParts.join("\n");
      const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedMessage },
      });
      sent = true;
      console.log(`[ReviewRequest] Gmail sent to ${order.customerEmail} — order ${order.orderNumber}`);
    } catch (err: any) {
      console.error(`[ReviewRequest] Gmail also failed: ${err.message}`);
    }
  }

  if (sent) {
    // Mark the order so we never send again
    await db
      .update(customerOrders)
      .set({ reviewEmailSentAt: new Date() })
      .where(eq(customerOrders.id, order.id));
  }
}

// ---------------------------------------------------------------------------
// Main export — called by the cron scheduler
// ---------------------------------------------------------------------------

export async function processReviewRequests(): Promise<void> {
  console.log("[ReviewRequest] Checking for orders ready for review request...");

  try {
    // 3 days ago (in ms)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const eligibleOrders = await db
      .select({
        id: customerOrders.id,
        orderNumber: customerOrders.orderNumber,
        customerEmail: customerOrders.customerEmail,
        customerFirstName: customerOrders.customerFirstName,
        deliveredAt: customerOrders.deliveredAt,
      })
      .from(customerOrders)
      .where(
        and(
          eq(customerOrders.status, "delivered"),
          isNotNull(customerOrders.deliveredAt),
          lte(customerOrders.deliveredAt, threeDaysAgo),
          isNull(customerOrders.reviewEmailSentAt)
        )
      )
      .limit(50); // Safety cap — process at most 50 per run

    if (eligibleOrders.length === 0) {
      console.log("[ReviewRequest] No eligible orders found.");
      return;
    }

    console.log(`[ReviewRequest] Found ${eligibleOrders.length} order(s) to process.`);

    for (const order of eligibleOrders) {
      try {
        await sendReviewEmail(order);
      } catch (err: any) {
        console.error(`[ReviewRequest] Failed for order ${order.orderNumber}: ${err.message}`);
      }
    }

    console.log("[ReviewRequest] Run complete.");
  } catch (err: any) {
    console.error("[ReviewRequest] Fatal error during run:", err);
  }
}
