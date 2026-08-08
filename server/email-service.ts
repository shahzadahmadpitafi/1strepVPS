import nodemailer from 'nodemailer';
import { storage } from './storage';
import { wrapEmailTemplate, sendEmailWithRetry } from './email';
import { ReplitConnectors } from '@replit/connectors-sdk';

// Helper function to get the correct published website URL
// Always use the production 1strep.com domain for customer-facing email links
const getSiteUrl = (): string => {
  return 'https://1strep.com';
};

// Replit Connectors SDK — handles OAuth token refresh automatically
const connectors = new ReplitConnectors();

let cachedSenderEmail: string | null = null;

async function getSenderEmail(): Promise<string> {
  if (cachedSenderEmail) return cachedSenderEmail;
  try {
    const resp = await connectors.proxy('google-mail', '/gmail/v1/users/me/profile');
    const profile = await resp.json() as any;
    cachedSenderEmail = profile.emailAddress || '';
    console.log('📧 Authenticated Gmail sender:', cachedSenderEmail);
  } catch {
    cachedSenderEmail = '';
  }
  return cachedSenderEmail;
}

const SMTP_FROM_USER = process.env.SMTP_USER || 'info@1strep.com';

async function sendEmailViaSmtp(to: string, subject: string, htmlBody: string, bcc?: string): Promise<boolean> {
  const password = process.env.SMTP_PASSWORD;
  if (!password) return false;

  const host = process.env.SMTP_HOST || 'mail.123-reg.co.uk';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: SMTP_FROM_USER, pass: password },
    connectionTimeout: 3000,
    greetingTimeout: 3000,
    socketTimeout: 3000,
  });

  await transporter.sendMail({
    from: `"1stRep" <${SMTP_FROM_USER}>`,
    to,
    bcc,
    subject,
    html: htmlBody,
  });
  return true;
}

function createEmailMessage(to: string, subject: string, htmlBody: string, bcc?: string, fromEmail?: string): string {
  // Build headers — keep only non-null entries, then append a MANDATORY blank line
  // before the body. RFC 2822 requires CRLF CRLF between headers and body.
  // Do NOT filter out the blank line (previous bug: .filter('' === '') removed it).
  const headers: string[] = [
    fromEmail ? `From: "1stRep" <${fromEmail}>` : null,
    `To: ${to}`,
    bcc ? `Bcc: ${bcc}` : null,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    `Subject: ${subject}`,
  ].filter((h): h is string => h !== null);

  // '' is the mandatory blank-line separator between headers and body
  const email = [...headers, '', htmlBody].join('\r\n');
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}


async function sendEmailViaGmail(to: string, subject: string, htmlBody: string, bcc?: string): Promise<boolean> {
  console.log('📧 sendEmailViaGmail called - to:', to, 'subject:', subject);

  // Deduplicate BCC — remove any address already in To (case-insensitive).
  // Gmail rejects sends where To and Bcc contain the same address, generating NDRs.
  const normalizedTo = to.toLowerCase().trim();
  let cleanBcc: string | undefined;
  if (bcc) {
    const dedupedBcc = bcc
      .split(',')
      .map(e => e.trim())
      .filter(e => e && e.toLowerCase() !== normalizedTo)
      .join(', ');
    cleanBcc = dedupedBcc || undefined;
  }
  if (bcc && bcc !== cleanBcc) {
    console.log(`📧 Removed duplicate BCC address (same as To): ${to}`);
  }

  // Try SMTP first — best deliverability using info@1strep.com via 123-reg
  if (process.env.SMTP_PASSWORD) {
    try {
      await sendEmailViaSmtp(to, subject, htmlBody, cleanBcc);
      console.log(`✅ Email sent via SMTP to ${to}: ${subject}`);
      return true;
    } catch (smtpError: any) {
      console.warn(`⚠️ SMTP failed (${smtpError.message}), falling back to Gmail API`);
    }
  }

  // Fallback: Gmail API via Replit Connectors SDK
  try {
    console.log('📧 Sending via Replit Connectors Gmail proxy...');
    const fromEmail = await getSenderEmail();
    const encodedMessage = createEmailMessage(to, subject, htmlBody, cleanBcc, fromEmail || undefined);
    const sendResp = await connectors.proxy('google-mail', '/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encodedMessage }),
    });
    if (!sendResp.ok) {
      const errText = await sendResp.text();
      console.error(`❌ Gmail proxy send failed (${sendResp.status}): ${errText}`);
      return false;
    }
    const sendResult = await sendResp.json() as any;
    console.log(`✅ Email sent via Gmail proxy to ${to}: ${subject} (id: ${sendResult?.id})`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to}:`, error?.message || error);
    return false;
  }
}

// ─── Shared email chrome ──────────────────────────────────────────────────────
const emailLogo = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background-color:#080808; padding:32px 40px 24px; text-align:center; border-bottom:2px solid #FAFAF8;">
        <img
          src="https://1strep.com/1strep-header-logo.png"
          alt="1stRep"
          width="150"
          style="display:inline-block; max-width:150px; height:auto;"
        />
        <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif; font-size:10px; letter-spacing:4px; text-transform:uppercase; color:#6E6E6E; margin-top:10px;">Wear Your Standards</div>
      </td>
    </tr>
  </table>`;

const emailFooterHtml = (siteUrl: string) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background-color:#080808; padding:28px 40px 32px; text-align:center; border-top:1px solid #3A3A3A;">
        <img
          src="https://1strep.com/1strep-header-logo.png"
          alt="1stRep"
          width="90"
          style="display:inline-block; max-width:90px; height:auto; opacity:0.7; margin-bottom:12px;"
        />
        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif; color:#3A3A3A; font-size:11px; margin:0 0 6px; letter-spacing:1px;">This is an automated message. Please do not reply directly to this email.</p>
        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif; color:#3A3A3A; font-size:11px; margin:0 0 6px;">&copy; ${new Date().getFullYear()} 1stRep. All rights reserved. &nbsp;|&nbsp; 1stRep Ltd, United Kingdom</p>
        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif; margin:0;"><a href="${siteUrl}" style="color:#FAFAF8; font-size:11px; text-decoration:none;">${siteUrl}</a></p>
      </td>
    </tr>
  </table>`;

function wrapOrderEmail(content: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#080808;font-family:Inter,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#080808;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#0F0F0F;border-radius:0;border:1px solid #3A3A3A;">
          <tr><td>${emailLogo}</td></tr>
          <tr><td>${content}</td></tr>
          <tr><td>${emailFooterHtml(siteUrl)}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
// ─────────────────────────────────────────────────────────────────────────────

// Order confirmation email template
const createOrderConfirmationEmail = (orderDetails: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderNumber: string;
  orderItems: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  shippingAddress: string;
}) => {
  const siteUrl = getSiteUrl();
  const itemsHtml = orderDetails.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 16px; border-bottom:1px solid #3A3A3A; font-family:Inter,'Helvetica Neue',Arial,sans-serif; font-size:14px; color:#B0B0B0;">${item.name}</td>
      <td style="padding:12px 16px; border-bottom:1px solid #3A3A3A; font-family:Inter,'Helvetica Neue',Arial,sans-serif; font-size:14px; color:#6E6E6E; text-align:center;">${item.quantity}</td>
      <td style="padding:12px 16px; border-bottom:1px solid #3A3A3A; font-family:Inter,'Helvetica Neue',Arial,sans-serif; font-size:14px; color:#FAFAF8; text-align:right; font-weight:600;">£${item.price.toFixed(2)}</td>
    </tr>`
    )
    .join('');

  const bodyContent = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:36px 40px 0;">

        <!-- Hero banner -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#161616;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:28px;">
          <tr>
            <td style="padding:28px;text-align:center;">
              <div style="display:inline-block;background-color:#161616;border:1px solid #3A3A3A;border-radius:50px;padding:8px 20px;margin-bottom:14px;">
                <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#FAFAF8;letter-spacing:2px;text-transform:uppercase;">&#10003; Payment Confirmed</span>
              </div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#ffffff;margin-bottom:6px;">Thank You for Your Order!</div>
              <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6E6E6E;">Your order is confirmed and being prepared.</div>
            </td>
          </tr>
        </table>

        <!-- Greeting -->
        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#B0B0B0;margin:0 0 6px;">Hi <strong style="color:#ffffff;">${orderDetails.customerName}</strong>,</p>
        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6E6E6E;margin:0 0 28px;line-height:1.7;">We have received your order and it is being processed. Here is a summary of everything you ordered.</p>

        <!-- Order meta -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #3A3A3A;">
              <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6E6E6E;">Order Number</span><br>
              <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:700;color:#FAFAF8;letter-spacing:1px;">${orderDetails.orderNumber}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;">Order Date</td>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#B0B0B0;text-align:right;font-weight:600;">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Order items -->
        <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6E6E6E;margin-bottom:10px;">Order Items</div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:4px;overflow:hidden;">
          <thead>
            <tr style="background-color:#161616;">
              <th style="padding:11px 16px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6E6E6E;text-align:left;">Item</th>
              <th style="padding:11px 16px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6E6E6E;text-align:center;">Qty</th>
              <th style="padding:11px 16px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6E6E6E;text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr style="background-color:#161616;border-top:1px solid #3A3A3A;">
              <td colspan="2" style="padding:16px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#ffffff;">Order Total</td>
              <td style="padding:16px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:800;color:#FAFAF8;text-align:right;">£${orderDetails.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#6E6E6E;margin:4px 0 28px;text-align:right;">All prices include VAT where applicable.</p>

        <!-- Delivery details -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #3A3A3A;">
              <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6E6E6E;">Delivery Address</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#B0B0B0;line-height:1.7;white-space:pre-line;">${orderDetails.shippingAddress}</td>
          </tr>
          ${orderDetails.customerPhone ? `<tr><td style="padding:0 24px 16px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6E6E6E;">Contact: <span style="color:#B0B0B0;">${orderDetails.customerPhone}</span></td></tr>` : ''}
        </table>

        <!-- What's next -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#161616;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:28px;">
          <tr>
            <td style="padding:20px 24px;">
              <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#FAFAF8;margin-bottom:12px;">What Happens Next?</div>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:5px 0;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#FAFAF8;">&#8250;&nbsp; We are preparing your order for dispatch</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#FAFAF8;">&#8250;&nbsp; You will receive a dispatch email with tracking details</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#FAFAF8;">&#8250;&nbsp; Estimated delivery: <strong style="color:#ffffff;">3&ndash;5 working days (UK)</strong></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
          <tr>
            <td style="background-color:#FAFAF8;border-radius:3px;">
              <a href="${siteUrl}/order-tracking" style="display:inline-block;padding:14px 36px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#080808;text-decoration:none;letter-spacing:1px;">Track Your Order &rarr;</a>
            </td>
          </tr>
        </table>

        <!-- Returns + Support -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
          <tr>
            <td width="48%" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;padding:18px 20px;vertical-align:top;">
              <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#FAFAF8;margin-bottom:7px;text-transform:uppercase;letter-spacing:1px;">30-Day Returns</div>
              <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;margin:0;line-height:1.65;">Not happy? Request a return within 30 days of delivery. <a href="${siteUrl}/returns" style="color:#FAFAF8;text-decoration:none;">Start a return &rarr;</a></p>
            </td>
            <td width="4%">&nbsp;</td>
            <td width="48%" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;padding:18px 20px;vertical-align:top;">
              <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#FAFAF8;margin-bottom:7px;text-transform:uppercase;letter-spacing:1px;">Need Help?</div>
              <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;margin:0;line-height:1.65;"><a href="mailto:support@1strep.com" style="color:#FAFAF8;text-decoration:none;">support@1strep.com</a><br><a href="${siteUrl}/support" style="color:#FAFAF8;text-decoration:none;">Support Portal &rarr;</a></p>
            </td>
          </tr>
        </table>

        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6E6E6E;margin:0 0 40px;line-height:1.7;">Best regards,<br><strong style="color:#ffffff;">The 1stRep Team</strong></p>

      </td>
    </tr>
  </table>`;

  return {
    from: `"1stRep" <${process.env.GMAIL_USER}>`,
    to: orderDetails.customerEmail,
    bcc: process.env.GMAIL_USER,
    subject: `Order Confirmed & Paid - ${orderDetails.orderNumber}`,
    html: wrapOrderEmail(bodyContent, siteUrl),
  };
};

// Shipping notification email template
const createShippingNotificationEmail = (orderDetails: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}) => {
  const siteUrl = getSiteUrl();
  const trackingLink = orderDetails.trackingUrl || `${siteUrl}/order-tracking`;
  const hasTracking = !!(orderDetails.trackingNumber);

  const bodyContent = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:36px 40px 0;">

        <!-- Hero -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#161616;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:28px;">
          <tr>
            <td style="padding:28px;text-align:center;">
              <div style="display:inline-block;background-color:#161616;border:1px solid #3A3A3A;border-radius:50px;padding:8px 20px;margin-bottom:14px;">
                <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#FAFAF8;letter-spacing:2px;text-transform:uppercase;">Order Dispatched</span>
              </div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#ffffff;margin-bottom:6px;">Your Order is on Its Way!</div>
              <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6E6E6E;">Hi <strong style="color:#B0B0B0;">${orderDetails.customerName}</strong> — it has been dispatched.</div>
            </td>
          </tr>
        </table>

        <!-- Order / Tracking details -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #3A3A3A;">
              <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6E6E6E;">Order Number</span><br>
              <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:17px;font-weight:700;color:#FAFAF8;">${orderDetails.orderNumber}</span>
            </td>
          </tr>
          ${hasTracking ? `
          <tr>
            <td style="padding:16px 24px;border-bottom:1px solid #3A3A3A;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;">Courier</td>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#B0B0B0;text-align:right;font-weight:600;">${orderDetails.carrier || 'Standard Delivery'}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;${orderDetails.estimatedDelivery ? 'border-bottom:1px solid #3A3A3A;' : ''}">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;">Tracking Number</td>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FAFAF8;text-align:right;font-weight:700;letter-spacing:1px;">${orderDetails.trackingNumber}</td>
                </tr>
              </table>
            </td>
          </tr>` : `
          <tr>
            <td style="padding:16px 24px;">
              <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6E6E6E;margin:0;line-height:1.6;">Tracking details will be sent to you as soon as they are available from your courier.</p>
            </td>
          </tr>`}
          ${orderDetails.estimatedDelivery ? `
          <tr>
            <td style="padding:16px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;">Estimated Delivery</td>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#FAFAF8;text-align:right;font-weight:700;">${orderDetails.estimatedDelivery}</td>
                </tr>
              </table>
            </td>
          </tr>` : ''}
        </table>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
          <tr>
            <td style="background-color:#FAFAF8;border-radius:3px;">
              <a href="${trackingLink}" style="display:inline-block;padding:14px 36px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:1px;">Track Your Order &rarr;</a>
            </td>
          </tr>
        </table>

        ${hasTracking ? `<p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6E6E6E;text-align:center;margin:0 0 32px;">You can also track your parcel directly on the ${orderDetails.carrier || 'courier'} website using the tracking number above.</p>` : ''}
        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6E6E6E;margin:0 0 40px;line-height:1.7;">Thank you for shopping with us!<br><strong style="color:#ffffff;">The 1stRep Team</strong></p>

      </td>
    </tr>
  </table>`;

  return {
    from: `"1stRep" <${process.env.GMAIL_USER}>`,
    to: orderDetails.customerEmail,
    bcc: process.env.GMAIL_USER,
    subject: `Your Order Has Been Dispatched! - ${orderDetails.orderNumber}`,
    html: wrapOrderEmail(bodyContent, siteUrl),
  };
};

// Send order confirmation email
export const sendOrderConfirmation = async (orderDetails: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderNumber: string;
  orderItems: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  shippingAddress: string;
}) => {
  console.log('📧 sendOrderConfirmation called for:', orderDetails.customerEmail, 'Order:', orderDetails.orderNumber);
  try {
    const mailOptions = createOrderConfirmationEmail(orderDetails);
    console.log('📧 Mail options created, to:', mailOptions.to, 'subject:', mailOptions.subject);
    
    // Get team members who want new order notifications
    const teamMemberEmails = await storage.getTeamMembersForNotification('newOrders');
    const allBcc = [mailOptions.bcc, ...teamMemberEmails].filter(Boolean).join(', ');
    console.log('📧 BCC recipients:', allBcc || 'none');
    
    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html,
      allBcc || undefined
    );
    console.log('📧 sendEmailViaGmail result:', success ? 'SUCCESS' : 'FAILED');
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    throw error;
  }
};

// Send shipping notification email
export const sendShippingNotification = async (orderDetails: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}) => {
  console.log('📦 sendShippingNotification called for:', orderDetails.customerEmail, 'Order:', orderDetails.orderNumber, 'Tracking:', orderDetails.trackingNumber);
  try {
    const mailOptions = createShippingNotificationEmail(orderDetails);
    console.log('📦 Shipping email options created, to:', mailOptions.to, 'subject:', mailOptions.subject);
    
    // Get team members who want shipping notifications
    const teamMemberEmails = await storage.getTeamMembersForNotification('shipping');
    const allBcc = [mailOptions.bcc, ...teamMemberEmails].filter(Boolean).join(', ');
    
    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html,
      allBcc || undefined
    );
    console.log('📦 Shipping notification email result:', success ? 'SUCCESS' : 'FAILED');
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('❌ Error sending shipping notification email:', error);
    throw error;
  }
};

// Delivery confirmation email template
const createDeliveryConfirmationEmail = (orderDetails: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  deliveredAt: string;
}) => {
  const siteUrl = getSiteUrl();
  const deliveryDate = new Date(orderDetails.deliveredAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const bodyContent = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:36px 40px 0;">

        <!-- Hero -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#161616;border-radius:3px;border:1px solid #166534;margin-bottom:28px;">
          <tr>
            <td style="padding:28px;text-align:center;">
              <div style="display:inline-block;width:60px;height:60px;background-color:#161616;border:1px solid #3A3A3A;border-radius:50%;line-height:60px;font-size:28px;color:#FAFAF8;font-weight:900;margin-bottom:16px;">&#10003;</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#ffffff;margin-bottom:6px;">Order Delivered!</div>
              <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6E6E6E;">Hi <strong style="color:#B0B0B0;">${orderDetails.customerName}</strong> — your package has arrived.</div>
            </td>
          </tr>
        </table>

        <!-- Delivery meta -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #3A3A3A;">
              <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6E6E6E;">Order Number</span><br>
              <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:17px;font-weight:700;color:#FAFAF8;">${orderDetails.orderNumber}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;">Delivered On</td>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#FAFAF8;text-align:right;font-weight:700;">${deliveryDate}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Feedback block -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:24px;">
          <tr>
            <td style="padding:22px 24px;text-align:center;">
              <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FAFAF8;margin-bottom:10px;">We'd Love Your Feedback</div>
              <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6E6E6E;margin:0 0 20px;line-height:1.7;">We hope you love your new product! Share your experience and help other athletes find their perfect fit.</p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 10px;">
                <tr>
                  <td style="background-color:#FAFAF8;border-radius:3px;">
                    <a href="${siteUrl}/feedback" style="display:inline-block;padding:12px 28px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:700;color:#080808;text-decoration:none;">Leave a Review &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Returns + Shop more -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
          <tr>
            <td width="48%" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;padding:18px 20px;vertical-align:top;">
              <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#FAFAF8;margin-bottom:7px;text-transform:uppercase;letter-spacing:1px;">Need to Return?</div>
              <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;margin:0;line-height:1.65;">You have 30 days from delivery. <a href="${siteUrl}/returns" style="color:#FAFAF8;text-decoration:none;">Start a return &rarr;</a></p>
            </td>
            <td width="4%">&nbsp;</td>
            <td width="48%" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;padding:18px 20px;vertical-align:top;">
              <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:700;color:#FAFAF8;margin-bottom:7px;text-transform:uppercase;letter-spacing:1px;">Shop Again</div>
              <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;margin:0;line-height:1.65;">Discover new drops and collections. <a href="${siteUrl}/shop-clean" style="color:#FAFAF8;text-decoration:none;">Shop now &rarr;</a></p>
            </td>
          </tr>
        </table>

        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6E6E6E;margin:0 0 40px;line-height:1.7;">Best regards,<br><strong style="color:#ffffff;">The 1stRep Team</strong></p>

      </td>
    </tr>
  </table>`;

  return {
    from: `"1stRep" <${process.env.GMAIL_USER}>`,
    to: orderDetails.customerEmail,
    bcc: process.env.GMAIL_USER,
    subject: `Your Order Has Been Delivered - ${orderDetails.orderNumber}`,
    html: wrapOrderEmail(bodyContent, siteUrl),
  };
};

// Send delivery confirmation email
export const sendDeliveryConfirmation = async (orderDetails: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  deliveredAt: string;
}) => {
  console.log('🚚 sendDeliveryConfirmation called for:', orderDetails.customerEmail, 'Order:', orderDetails.orderNumber);
  try {
    const mailOptions = createDeliveryConfirmationEmail(orderDetails);
    console.log('🚚 Delivery email options created, to:', mailOptions.to, 'subject:', mailOptions.subject);
    
    // Get team members who want delivery notifications
    const teamMemberEmails = await storage.getTeamMembersForNotification('delivery');
    const allBcc = [mailOptions.bcc, ...teamMemberEmails].filter(Boolean).join(', ');
    
    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html,
      allBcc || undefined
    );
    console.log('🚚 Delivery confirmation email result:', success ? 'SUCCESS' : 'FAILED');
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('❌ Error sending delivery confirmation email:', error);
    throw error;
  }
};

// Order status update email template
const createOrderStatusUpdateEmail = (orderDetails: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
}) => {
  const siteUrl = getSiteUrl();
  
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    pending: {
      title: 'Order Pending',
      message: 'Your order is awaiting processing. We shall update you once it moves forward.',
      color: '#B0B0B0'
    },
    paid: {
      title: 'Payment Confirmed',
      message: 'Thank you! Your payment has been received and confirmed. Your order is now being prepared.',
      color: '#FAFAF8'
    },
    processing: {
      title: 'Order Being Processed',
      message: 'Great news! Your order is now being prepared for dispatch.',
      color: '#FAFAF8'
    },
    shipped: {
      title: 'Order Dispatched',
      message: 'Your order has been dispatched and is on its way to you!',
      color: '#B0B0B0'
    },
    delivered: {
      title: 'Order Delivered',
      message: 'Your order has been delivered. We hope you love your new product!',
      color: '#FAFAF8'
    },
    refunded: {
      title: 'Order Refunded',
      message: 'Your order has been refunded. The refund should appear in your account within 5-10 business days.',
      color: '#B0B0B0'
    },
    cancelled: {
      title: 'Order Cancelled',
      message: 'Your order has been cancelled. If you did not request this, please contact us immediately.',
      color: '#6E6E6E'
    }
  };
  
  const statusInfo = statusMessages[orderDetails.newStatus] || {
    title: `Order Status: ${orderDetails.newStatus}`,
    message: `Your order status has been updated to ${orderDetails.newStatus}.`,
    color: '#FAFAF8'
  };

  const trackingBlock = orderDetails.trackingNumber ? `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:24px;">
          <tr>
            <td style="padding:16px 24px;border-bottom:1px solid #3A3A3A;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;">Tracking Number</td>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#FAFAF8;text-align:right;font-weight:700;">${orderDetails.trackingNumber}</td>
                </tr>
              </table>
            </td>
          </tr>
          ${orderDetails.trackingUrl ? `<tr><td style="padding:14px 24px;text-align:right;"><a href="${orderDetails.trackingUrl}" style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#FAFAF8;font-weight:600;text-decoration:none;">Track Parcel &rarr;</a></td></tr>` : ''}
        </table>` : '';

  const updatedAt = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const bodyContent = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:36px 40px 0;">

        <!-- Status hero -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:28px;">
          <tr>
            <td style="padding:6px 0;background-color:${statusInfo.color};border-radius:3px 10px 0 0;"></td>
          </tr>
          <tr>
            <td style="padding:24px;text-align:center;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#ffffff;margin-bottom:10px;">${statusInfo.title}</div>
              <div style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6E6E6E;line-height:1.7;">${statusInfo.message}</div>
            </td>
          </tr>
        </table>

        <!-- Greeting -->
        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#B0B0B0;margin:0 0 6px;">Hi <strong style="color:#ffffff;">${orderDetails.customerName}</strong>,</p>
        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6E6E6E;margin:0 0 24px;line-height:1.7;">Your order status has been updated. Here are the details.</p>

        <!-- Order meta -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border-radius:3px;border:1px solid #3A3A3A;margin-bottom:24px;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #3A3A3A;">
              <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6E6E6E;">Order Number</span><br>
              <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:17px;font-weight:700;color:#FAFAF8;">${orderDetails.orderNumber}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;border-bottom:1px solid #3A3A3A;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;">Status Updated</td>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#6E6E6E;text-align:right;">${updatedAt}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6E6E6E;">New Status</td>
                  <td style="text-align:right;">
                    <span style="display:inline-block;background-color:${statusInfo.color};color:#fff;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:5px 14px;border-radius:50px;">${orderDetails.newStatus.charAt(0).toUpperCase() + orderDetails.newStatus.slice(1)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${trackingBlock}

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
          <tr>
            <td style="background-color:#FAFAF8;border-radius:3px;">
              <a href="${siteUrl}/order-tracking" style="display:inline-block;padding:14px 36px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#080808;text-decoration:none;letter-spacing:1px;">View Your Order &rarr;</a>
            </td>
          </tr>
        </table>

        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6E6E6E;text-align:center;margin:0 0 12px;">Questions? <a href="${siteUrl}/contact-support" style="color:#FAFAF8;text-decoration:none;">Contact Support</a></p>
        <p style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6E6E6E;margin:0 0 40px;line-height:1.7;">Best regards,<br><strong style="color:#ffffff;">The 1stRep Team</strong></p>

      </td>
    </tr>
  </table>`;

  return {
    from: `"1stRep" <${process.env.GMAIL_USER}>`,
    to: orderDetails.customerEmail,
    bcc: process.env.GMAIL_USER,
    subject: `${statusInfo.title} - ${orderDetails.orderNumber}`,
    html: wrapOrderEmail(bodyContent, siteUrl),
  };
};

// Send order status update email
export const sendOrderStatusUpdate = async (orderDetails: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
}) => {
  console.log('📋 sendOrderStatusUpdate called for:', orderDetails.customerEmail, 'Order:', orderDetails.orderNumber, 'Status:', orderDetails.previousStatus, '->', orderDetails.newStatus);
  try {
    const mailOptions = createOrderStatusUpdateEmail(orderDetails);
    console.log('📋 Status update email options created, to:', mailOptions.to, 'subject:', mailOptions.subject);

    // BCC business email + all team members who want order updates
    const teamMemberEmails = await storage.getTeamMembersForNotification('newOrders');
    const allBcc = [mailOptions.bcc, ...teamMemberEmails].filter(Boolean).join(', ');
    console.log('📋 BCC recipients for status update:', allBcc || 'none');

    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html,
      allBcc || undefined
    );
    console.log('📋 Order status update email result:', success ? 'SUCCESS' : 'FAILED');
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('❌ Error sending order status update email:', error);
    throw error;
  }
};

// Welcome email template — fully branded, community-focused
const checkRow = (text: string) => `
  <tr>
    <td style="padding:9px 0;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td width="26" valign="top" style="padding-top:1px;">
            <table cellpadding="0" cellspacing="0" style="width:18px;height:18px;">
              <tr><td style="background-color:#FAFAF8;border-radius:3px;width:18px;height:18px;text-align:center;color:#080808;font-size:12px;font-weight:900;line-height:18px;">&#10003;</td></tr>
            </table>
          </td>
          <td style="color:#B0B0B0;font-size:14px;line-height:1.6;">${text}</td>
        </tr>
      </table>
    </td>
  </tr>
`;

const createWelcomeEmail = (userDetails: {
  name: string;
  email: string;
  isReseller?: boolean;
}) => {
  const siteUrl = getSiteUrl();
  const firstName = (userDetails.name || 'there').split(' ')[0];

  const content = `
    <tr>
      <td style="padding:44px 40px 8px;">
        <p style="color:#6E6E6E;margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:Inter,Arial,sans-serif;">
          ${userDetails.isReseller ? 'Reseller Account Activated' : 'Account Confirmed'}
        </p>
        <h2 style="color:#FAFAF8;margin:0 0 20px;font-size:26px;font-weight:900;letter-spacing:-0.5px;">
          You're in, ${firstName}.
        </h2>
        <p style="color:#B0B0B0;line-height:1.7;margin:0 0 16px;font-size:15px;">
          Welcome to 1stRep — you've just joined a growing community of athletes across the UK who train hard and never settle for ordinary kit.
        </p>
        <p style="color:#B0B0B0;line-height:1.7;margin:0 0 28px;font-size:15px;">
          ${userDetails.isReseller
            ? "Your reseller account is now active. You've got wholesale pricing and a dedicated dashboard ready to go."
            : "Whether you're chasing a PB, competing this season, or just showing up every day — you're one of us now."}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 8px;">
        <table cellpadding="0" cellspacing="0" style="width:100%;background-color:#161616;border:1px solid #3A3A3A;border-radius:4px;">
          <tr>
            <td style="padding:22px 24px;">
              <p style="color:#FAFAF8;margin:0 0 4px;font-size:14px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                ${userDetails.isReseller ? 'Your Reseller Toolkit' : 'Get Started'}
              </p>
              <p style="color:#B0B0B0;margin:0;font-size:14px;line-height:1.6;">
                ${userDetails.isReseller
                  ? 'Browse the wholesale catalogue, place your first order, and start building your storefront.'
                  : 'Browse the latest collections and find your next piece of kit.'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px 8px;">
        <p style="color:#FAFAF8;margin:0 0 16px;font-size:14px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
          What Happens Next
        </p>
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          ${checkRow('Explore our premium activewear collections')}
          ${checkRow('Enjoy free delivery on orders over &pound;100')}
          ${checkRow('Track your orders and manage your account')}
          ${userDetails.isReseller ? checkRow('Access wholesale pricing and your reseller dashboard') : checkRow('Join the community — tag us <strong style="color:#FAFAF8;">@1strep</strong> in your training')}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 40px 8px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:20px auto;">
          <tr>
            <td style="background-color:#FAFAF8;border-radius:3px;">
              <a href="${userDetails.isReseller ? siteUrl + '/reseller/login' : siteUrl + '/shop-clean'}" style="display:inline-block;padding:14px 36px;color:#080808;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1px;font-family:Inter,Arial,sans-serif;text-transform:uppercase;">
                ${userDetails.isReseller ? 'Access Reseller Dashboard' : 'Start Shopping'}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 36px;">
        <p style="color:#6E6E6E;margin:0;font-size:13px;line-height:1.6;text-align:center;">
          Got a question? Just reply to this email — our team is here to help.
        </p>
      </td>
    </tr>
  `;

  return {
    from: `"1stRep" <${process.env.GMAIL_USER}>`,
    to: userDetails.email,
    subject: `Welcome to 1stRep${userDetails.isReseller ? ' — Your Reseller Account is Live' : ' — You\'re In'}`,
    html: wrapEmailTemplate(content),
  };
};

// Reseller application received email template
const createResellerApplicationEmail = (applicationDetails: {
  name: string;
  email: string;
  businessName: string;
}) => {
  const siteUrl = getSiteUrl();
  return {
    from: `"1stRep" <${process.env.GMAIL_USER}>`,
    to: applicationDetails.email,
    subject: 'Reseller Application Received - 1stRep',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">1stRep Reseller Programme</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #000;">Application Received!</h2>
          <p>Hi ${applicationDetails.name},</p>
          <p>Thank you for applying to become a 1stRep reseller. We are delighted that you are interested in partnering with us!</p>
          
          <div style="background-color:#161616; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Business Name:</strong> ${applicationDetails.businessName}</p>
            <p><strong>Application Status:</strong> Under Review</p>
          </div>
          
          <div style="background-color:#161616; padding: 15px; margin: 20px 0; border-radius: 5px; border:1px solid #3A3A3A;">
            <p style="margin: 0;"><strong>⏳ What Happens Next?</strong></p>
            <p style="margin: 5px 0 0 0;">Our team will review your application within 2-3 working days. We shall notify you via email once a decision has been made.</p>
          </div>
          
          <p>In the meantime, feel free to browse our product catalogue to get familiar with our offerings.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/shop" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Browse Our Catalogue</a>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The 1stRep Team</strong></p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 0.9em; color:#B0B0B0;">
          <p>&copy; ${new Date().getFullYear()} 1stRep. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;"><a href="${siteUrl}" style="color:#B0B0B0;">${siteUrl}</a></p>
        </div>
      </body>
      </html>
    `,
  };
};

// Reseller approved email template
const createResellerApprovedEmail = (resellerDetails: {
  name: string;
  email: string;
  tier: string;
  discountPercentage: number;
}) => {
  const siteUrl = getSiteUrl();
  return {
    from: `"1stRep" <${process.env.GMAIL_USER}>`,
    to: resellerDetails.email,
    subject: '🎉 Congratulations! Your Reseller Application Has Been Approved - Welcome to 1stRep!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">1stRep Reseller Programme</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #000;">Congratulations, ${resellerDetails.name}! 🎉</h2>
          <p>We are absolutely thrilled to welcome you to the 1stRep family!</p>
          <p>Your reseller application has been <strong style="color: #28a745;">approved</strong>, and we cannot wait to see your business flourish with our premium fitness apparel.</p>
          
          <div style="background-color:#161616; padding: 20px; margin: 20px 0; border-radius: 5px; border:1px solid #3A3A3A;">
            <h3 style="color: #155724; margin-top: 0;">🌟 Your Exclusive Reseller Benefits:</h3>
            <ul style="color: #155724; margin: 10px 0;">
              <li><strong>Tier Level:</strong> ${resellerDetails.tier}</li>
              <li><strong>Wholesale Discount:</strong> ${resellerDetails.discountPercentage}% off retail prices</li>
              <li>Full access to our wholesale inventory</li>
              <li>Dedicated reseller dashboard with order management</li>
              <li>Priority customer support</li>
              <li>Early access to new product launches</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/reseller/login" style="background-color: #000; color: #fff; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">Access Your Reseller Dashboard</a>
          </div>
          
          <p style="text-align: center; color:#B0B0B0; font-size: 0.9em;">Or visit: <a href="${siteUrl}/reseller/login" style="color: #000;">${siteUrl}/reseller/login</a></p>
          
          <div style="background-color:#161616; padding: 15px; margin: 20px 0; border-radius: 5px; border:1px solid #3A3A3A;">
            <p style="margin: 0;"><strong>🚀 Getting Started:</strong></p>
            <p style="margin: 5px 0 0 0;">Log in with your registered email and password to start browsing our wholesale catalogue, placing orders, and managing your inventory.</p>
          </div>
          
          <p>If you have any questions or need assistance getting started, our team is here to help. Simply reply to this email or reach out through your dashboard.</p>
          
          <p style="margin-top: 30px;">Welcome to the team - we are excited to have you on board!<br><strong>The 1stRep Team</strong></p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 0.9em; color:#B0B0B0;">
          <p>&copy; ${new Date().getFullYear()} 1stRep. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;"><a href="${siteUrl}" style="color:#B0B0B0;">${siteUrl}</a></p>
        </div>
      </body>
      </html>
    `,
  };
};

// Reseller rejected email template
const createResellerRejectedEmail = (applicantDetails: {
  name: string;
  email: string;
}) => {
  const siteUrl = getSiteUrl();
  return {
    from: `"1stRep" <${process.env.GMAIL_USER}>`,
    to: applicantDetails.email,
    subject: 'Reseller Application Update - 1stRep',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">1stRep Reseller Programme</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #000;">Reseller Application Update</h2>
          <p>Hi ${applicantDetails.name},</p>
          <p>Thank you for your interest in becoming a 1stRep reseller.</p>
          
          <p>After careful review, we are unable to approve your reseller application at this time. This decision is based on our current reseller criteria and capacity.</p>
          
          <div style="background-color:#161616; padding: 15px; margin: 20px 0; border-radius: 5px; border:1px solid #3A3A3A;">
            <p style="margin: 0;"><strong>Interested in Reapplying?</strong></p>
            <p style="margin: 5px 0 0 0;">You are welcome to reapply after 6 months. We encourage you to grow your business and strengthen your application for future consideration.</p>
          </div>
          
          <p>In the meantime, you can still shop our collections as a valued customer and enjoy our premium activewear.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/shop" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Shop Now</a>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The 1stRep Team</strong></p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 0.9em; color:#B0B0B0;">
          <p>&copy; ${new Date().getFullYear()} 1stRep. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;"><a href="${siteUrl}" style="color:#B0B0B0;">${siteUrl}</a></p>
        </div>
      </body>
      </html>
    `,
  };
};

// Send welcome email
export const sendWelcomeEmail = async (userDetails: {
  name: string;
  email: string;
  isReseller?: boolean;
}) => {
  try {
    const mailOptions = createWelcomeEmail(userDetails);
    const success = await sendEmailWithRetry(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html,
      3
    );
    console.log(success ? 'Welcome email sent' : `Welcome email FAILED after retries for ${mailOptions.to}`);
    return { success, messageId: success ? 'sent' : undefined };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: String(error) };
  }
};

// Send reseller application received email
export const sendResellerApplicationEmail = async (applicationDetails: {
  name: string;
  email: string;
  businessName: string;
}) => {
  try {
    const mailOptions = createResellerApplicationEmail(applicationDetails);
    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html
    );
    console.log('Reseller application email sent');
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('Error sending reseller application email:', error);
    return { success: false, error: String(error) };
  }
};

// Send reseller approved email
export const sendResellerApprovedEmail = async (resellerDetails: {
  name: string;
  email: string;
  tier: string;
  discountPercentage: number;
}) => {
  try {
    const mailOptions = createResellerApprovedEmail(resellerDetails);
    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html
    );
    console.log('Reseller approved email sent');
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('Error sending reseller approved email:', error);
    return { success: false, error: String(error) };
  }
};

// Send reseller rejected email
export const sendResellerRejectedEmail = async (applicantDetails: {
  name: string;
  email: string;
}) => {
  try {
    const mailOptions = createResellerRejectedEmail(applicantDetails);
    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html
    );
    console.log('Reseller rejected email sent');
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('Error sending reseller rejected email:', error);
    return { success: false, error: String(error) };
  }
};

// Password reset email template
const createPasswordResetEmail = (resetDetails: {
  name: string;
  email: string;
  resetUrl: string;
}) => {
  const siteUrl = getSiteUrl();
  return {
    from: `"1stRep" <${process.env.GMAIL_USER}>`,
    to: resetDetails.email,
    subject: 'Reset Your Password - 1stRep',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">1stRep</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #000;">Reset Your Password</h2>
          <p>Hi ${resetDetails.name},</p>
          <p>We received a request to reset your password for your 1stRep account.</p>
          
          <div style="background-color:#161616; padding: 15px; margin: 20px 0; border-radius: 5px; border:1px solid #3A3A3A;">
            <p style="margin: 0;"><strong>Important:</strong></p>
            <p style="margin: 5px 0 0 0;">This password reset link will expire in 1 hour for security reasons.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetDetails.resetUrl}" 
               style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>If the button above does not work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color:#B0B0B0; font-size: 0.9em;">${resetDetails.resetUrl}</p>
          
          <div style="background-color:#161616; padding: 15px; margin: 20px 0; border-radius: 5px; border:1px solid #3A3A3A;">
            <p style="margin: 0;"><strong>Did not request this?</strong></p>
            <p style="margin: 5px 0 0 0;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The 1stRep Team</strong></p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 0.9em; color:#B0B0B0;">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} 1stRep. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;"><a href="${siteUrl}" style="color:#B0B0B0;">${siteUrl}</a></p>
        </div>
      </body>
      </html>
    `,
  };
};

// Send password reset email
export const sendPasswordResetEmail = async (resetDetails: {
  name: string;
  email: string;
  resetUrl: string;
}) => {
  try {
    const mailOptions = createPasswordResetEmail(resetDetails);
    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html
    );
    console.log('Password reset email sent');
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Abandoned cart reminder email template
const createAbandonedCartReminderEmail = (cartDetails: {
  email: string;
  firstName?: string;
  cartId: string;
  totalValue: string;
  itemCount: number;
  stage: 'first' | 'second' | 'final';
}) => {
  const customerName = cartDetails.firstName || 'there';
  const siteUrl = getSiteUrl();
  
  const stageContent = {
    first: {
      subject: "You left something behind!",
      heading: "Do Not Forget Your Items",
      message: "We noticed you left some items in your basket. They are waiting for you!",
      urgency: "",
    },
    second: {
      subject: "Still thinking about it?",
      heading: "Your Basket is Still Here",
      message: "Just a friendly reminder that your items are still in your basket.",
      urgency: "These items are popular and may sell out soon.",
    },
    final: {
      subject: "Last chance - Your basket expires soon!",
      heading: "Final Reminder: Complete Your Order",
      message: "This is your last reminder! Your basket will expire soon and these items may no longer be available.",
      urgency: "Act now before it is too late!",
    },
  };

  const content = stageContent[cartDetails.stage];
  const cartUrl = `${siteUrl}/cart`;

  return {
    from: `"1stRep" <${process.env.GMAIL_USER}>`,
    to: cartDetails.email,
    subject: content.subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">1stRep</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #000;">${content.heading}</h2>
          <p>Hi ${customerName},</p>
          <p>${content.message}</p>
          
          <div style="background-color:#161616; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Basket Summary:</strong></p>
            <p>Items: ${cartDetails.itemCount}</p>
            <p style="font-size: 1.2em; font-weight: bold; color: #000;">Total: £${parseFloat(cartDetails.totalValue).toFixed(2)}</p>
          </div>
          
          ${content.urgency ? `
          <div style="background-color:#161616; padding: 15px; margin: 20px 0; border-radius: 5px; border:1px solid #3A3A3A;">
            <p style="margin: 0;"><strong>${content.urgency}</strong></p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${cartUrl}" 
               style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Complete Your Order
            </a>
          </div>
          
          <p>If you have any questions or need assistance, please do not hesitate to contact us.</p>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The 1stRep Team</strong></p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 0.9em; color:#B0B0B0;">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} 1stRep. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;"><a href="${siteUrl}" style="color:#B0B0B0;">${siteUrl}</a></p>
        </div>
      </body>
      </html>
    `,
  };
};

// Send abandoned cart reminder email
export const sendAbandonedCartReminder = async (cartDetails: {
  email: string;
  firstName?: string;
  cartId: string;
  totalValue: string;
  itemCount: number;
}, stage: 'first' | 'second' | 'final') => {
  try {
    const mailOptions = createAbandonedCartReminderEmail({ ...cartDetails, stage });
    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html
    );
    console.log(`Abandoned cart ${stage} reminder email sent`);
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error(`Error sending abandoned cart ${stage} reminder email:`, error);
    throw error;
  }
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    const email = await getSenderEmail();
    console.log('Email service ready, sender:', email || '(unknown)');
    return { success: true, message: `Email service connected — sending as ${email || 'Gmail account'}` };
  } catch (error) {
    console.error('Email service connection failed:', error);
    throw error;
  }
};

// Referral invitation email template
const createReferralInvitationEmail = (details: {
  senderName: string;
  recipientEmail: string;
  recipientName?: string;
  referralCode: string;
  message?: string;
  discountValue?: string;
  discountType?: string;
}) => {
  const discountText = details.discountType === 'percentage' 
    ? `${details.discountValue}% off` 
    : `£${details.discountValue} off`;
  
  const greeting = details.recipientName 
    ? `Hi ${details.recipientName},` 
    : 'Hi there,';
    
  const personalMessage = details.message 
    ? `<div style="background-color:#161616; padding: 15px; margin: 20px 0; border-radius: 5px; border:1px solid #3A3A3A; font-style: italic;">
        <p style="margin: 0;">"${details.message}"</p>
        <p style="margin: 5px 0 0 0; text-align: right;"><strong>- ${details.senderName}</strong></p>
      </div>` 
    : '';

  const baseUrl = getSiteUrl();

  return {
    from: `"1stRep" <${process.env.GMAIL_USER}>`,
    to: details.recipientEmail,
    subject: `${details.senderName} thinks you will love 1stRep - Get ${discountText} on your first order!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">1stRep</h1>
          <p style="margin: 5px 0 0 0; font-size: 0.9em;">Premium Fitness Apparel</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #000;">You Have Been Invited!</h2>
          ${greeting}
          <p>Your friend <strong>${details.senderName}</strong> thinks you would love 1stRep's premium fitness apparel and has sent you an exclusive invitation.</p>
          
          ${personalMessage}
          
          <div style="background-color:#161616; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; border:1px solid #3A3A3A;">
            <p style="margin: 0; font-size: 0.9em; color: #155724;">YOUR EXCLUSIVE DISCOUNT CODE</p>
            <p style="margin: 10px 0; font-size: 1.8em; font-weight: bold; color: #000; letter-spacing: 2px;">${details.referralCode}</p>
            <p style="margin: 0; font-size: 1.1em; color: #155724;"><strong>Get ${discountText} your first order!</strong></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}?ref=${details.referralCode}" 
               style="background-color: #000; color: #fff; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 1.1em; font-weight: bold;">
              Shop Now & Save
            </a>
          </div>
          
          <h3 style="color: #000;">Why You Will Love 1stRep:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0;">Premium quality fitness apparel</li>
            <li style="padding: 8px 0;">Tactical/outdoor inspired designs</li>
            <li style="padding: 8px 0;">Free delivery on orders over £100</li>
            <li style="padding: 8px 0;">UK-based with fast delivery</li>
          </ul>
          
          <p style="margin-top: 30px; font-size: 0.9em; color:#B0B0B0;">
            Simply enter the code <strong>${details.referralCode}</strong> at checkout to claim your discount.
          </p>
          
          <p style="margin-top: 20px;">See you soon!<br><strong>The 1stRep Team</strong></p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 0.9em; color:#B0B0B0;">
          <p>This email was sent because ${details.senderName} thought you would enjoy 1stRep.</p>
          <p>&copy; ${new Date().getFullYear()} 1stRep. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;"><a href="${baseUrl}" style="color:#B0B0B0;">${baseUrl}</a></p>
        </div>
      </body>
      </html>
    `,
  };
};

// Send referral invitation email
export const sendReferralInvitation = async (details: {
  senderName: string;
  recipientEmail: string;
  recipientName?: string;
  referralCode: string;
  message?: string;
  discountValue?: string;
  discountType?: string;
}) => {
  try {
    const mailOptions = createReferralInvitationEmail(details);
    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html
    );
    console.log('Referral invitation email sent');
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('Error sending referral invitation email:', error);
    return { success: false, error: String(error) };
  }
};

// Job application email template
const createJobApplicationEmail = (details: {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  jobTitle: string;
  department: string;
  location: string;
  coverLetter: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
}) => {
  const siteUrl = getSiteUrl();
  return {
    from: `"1stRep Careers" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER, // Send to configured email
    replyTo: details.applicantEmail,
    subject: `Job Application: ${details.jobTitle} - ${details.applicantName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Job Application</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #000; margin-top: 0;">Application Details</h2>
          
          <div style="background-color:#161616; padding: 20px; margin: 20px 0; border-radius: 5px; border:1px solid #3A3A3A;">
            <h3 style="color: #000; margin-top: 0;">Position Applied For</h3>
            <p><strong>Job Title:</strong> ${details.jobTitle}</p>
            <p><strong>Department:</strong> ${details.department}</p>
            <p><strong>Location:</strong> ${details.location}</p>
          </div>
          
          <div style="background-color:#161616; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #000; margin-top: 0;">Applicant Information</h3>
            <p><strong>Name:</strong> ${details.applicantName}</p>
            <p><strong>Email:</strong> <a href="mailto:${details.applicantEmail}">${details.applicantEmail}</a></p>
            <p><strong>Phone:</strong> <a href="tel:${details.applicantPhone}">${details.applicantPhone}</a></p>
            ${details.linkedinUrl ? `<p><strong>LinkedIn:</strong> <a href="${details.linkedinUrl}">${details.linkedinUrl}</a></p>` : ''}
            ${details.portfolioUrl ? `<p><strong>Portfolio:</strong> <a href="${details.portfolioUrl}">${details.portfolioUrl}</a></p>` : ''}
          </div>
          
          <div style="background-color:#161616; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="color: #000; margin-top: 0;">Cover Letter / Message</h3>
            <p style="white-space: pre-wrap;">${details.coverLetter}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${details.applicantEmail}?subject=Re: Your Application for ${details.jobTitle}" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reply to Applicant</a>
          </div>
          
          <p style="font-size: 0.9em; color:#B0B0B0; margin-top: 20px;">
            This application was submitted on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}.
          </p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 0.9em; color:#B0B0B0;">
          <p>This is an automated email from the 1stRep careers portal.</p>
          <p>&copy; ${new Date().getFullYear()} 1stRep. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;"><a href="${siteUrl}" style="color:#B0B0B0;">${siteUrl}</a></p>
        </div>
      </body>
      </html>
    `,
  };
};

// Send job application email
export const sendJobApplication = async (details: {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  jobTitle: string;
  department: string;
  location: string;
  coverLetter: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
}) => {
  try {
    const mailOptions = createJobApplicationEmail(details);
    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html
    );
    console.log('Job application email sent');
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('Error sending job application email:', error);
    return { success: false, error: String(error) };
  }
};

// Send new order notification to team members
export const sendTeamOrderNotification = async (details: {
  teamMemberEmail: string;
  teamMemberName: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  orderItems: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
}) => {
  try {
    const siteUrl = getSiteUrl();
    const itemsHtml = details.orderItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">£${item.price.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const subject = `New Order: ${details.orderNumber} - £${details.totalAmount.toFixed(2)}`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">1stRep - New Order Alert</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hi ${details.teamMemberName},</p>
            <p>A new order has been placed and requires attention.</p>
            
            <div style="background-color:#161616; padding: 15px; margin: 20px 0; border-radius: 5px; border:1px solid #3A3A3A;">
              <p style="margin: 0;"><strong>Order Number:</strong> ${details.orderNumber}</p>
              <p style="margin: 5px 0 0 0;"><strong>Customer:</strong> ${details.customerName}</p>
              ${details.customerPhone ? `<p style="margin: 5px 0 0 0;"><strong>Phone (Primary Contact):</strong> <a href="tel:${details.customerPhone}">${details.customerPhone}</a></p>` : ''}
              ${details.customerEmail ? `<p style="margin: 5px 0 0 0;"><strong>Email:</strong> ${details.customerEmail}</p>` : ''}
              <p style="margin: 5px 0 0 0;"><strong>Order Total:</strong> £${details.totalAmount.toFixed(2)}</p>
              <p style="margin: 5px 0 0 0;"><strong>Order Time:</strong> ${new Date().toLocaleString('en-GB')}</p>
            </div>
            
            <h3 style="color: #000;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; background-color:#161616;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="padding: 8px; text-align: left;">Item</th>
                  <th style="padding: 8px; text-align: center;">Qty</th>
                  <th style="padding: 8px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/admin/orders" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Order in Dashboard</a>
            </div>
          </div>
          
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 0.9em; color:#B0B0B0;">
            <p>This is an automated notification from 1stRep.</p>
            <p>&copy; ${new Date().getFullYear()} 1stRep. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

    const success = await sendEmailViaGmail(details.teamMemberEmail, subject, html);
    console.log(`📧 Team order notification sent to ${details.teamMemberEmail}`);
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('Error sending team order notification:', error);
    return { success: false, error: String(error) };
  }
};

// Send custom email to customer from admin
export const sendCustomerEmail = async (details: {
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  orderNumber?: string;
  senderName?: string;
}) => {
  try {
    const siteUrl = getSiteUrl();
    const formattedMessage = details.message.replace(/\n/g, '<br>');
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">1stRep</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Dear ${details.customerName},</p>
            
            ${details.orderNumber ? `
            <div style="background-color:#161616; padding: 10px 15px; margin: 15px 0; border-radius:3px; border:1px solid #3A3A3A;">
              <p style="margin: 0;"><strong>Regarding Order:</strong> ${details.orderNumber}</p>
            </div>
            ` : ''}
            
            <div style="margin: 20px 0;">
              ${formattedMessage}
            </div>
            
            <p style="margin-top: 30px;">
              Kind regards,<br>
              <strong>${details.senderName || 'The 1stRep Team'}</strong>
            </p>
          </div>
          
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 0.9em; color:#B0B0B0;">
            <p>You can reply directly to this email if you have any questions.</p>
            <p>&copy; ${new Date().getFullYear()} 1stRep. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;"><a href="${siteUrl}" style="color:#B0B0B0;">${siteUrl}</a></p>
          </div>
        </body>
        </html>
      `;
    
    const success = await sendEmailViaGmail(details.customerEmail, details.subject, html);
    if (!success) {
      throw new Error('Both SMTP and Gmail failed to deliver the email — check email service configuration');
    }
    console.log(`📧 Custom email sent to ${details.customerEmail}`);
    return { success, messageId: 'gmail-api' };
  } catch (error) {
    console.error('Error sending custom customer email:', error);
    throw error;
  }
};

// Alias exports for backward compatibility with routes.ts
export const sendOrderConfirmationEmail = sendOrderConfirmation;
export const sendReceiptEmail = sendOrderConfirmation;

// Team member notification settings updated email
const createNotificationSettingsUpdatedEmail = (details: {
  teamMemberName: string;
  teamMemberEmail: string;
  notifications: {
    newOrders: boolean;
    shipping: boolean;
    delivery: boolean;
    lowStock: boolean;
    supportTickets: boolean;
  };
}) => {
  const siteUrl = getSiteUrl();
  
  const enabledNotifications: string[] = [];
  if (details.notifications.newOrders) enabledNotifications.push('New Orders');
  if (details.notifications.shipping) enabledNotifications.push('Shipping Updates');
  if (details.notifications.delivery) enabledNotifications.push('Deliveries');
  if (details.notifications.lowStock) enabledNotifications.push('Low Stock Alerts');
  if (details.notifications.supportTickets) enabledNotifications.push('Support Tickets');
  
  const notificationList = enabledNotifications.length > 0
    ? enabledNotifications.map(n => `<li style="padding: 5px 0;">${n}</li>`).join('')
    : '<li style="padding: 5px 0; color:#B0B0B0;">No notifications enabled</li>';
  
  return {
    to: details.teamMemberEmail,
    subject: 'Your Email Notification Settings Have Been Updated - 1stRep Admin',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">1stRep Admin</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #000;">Email Notification Settings Updated</h2>
          <p>Hi ${details.teamMemberName},</p>
          <p>Your email notification settings have been updated by an administrator. Here are your current notification preferences:</p>
          
          <div style="background-color:#161616; padding: 20px; margin: 20px 0; border-radius:3px; border:1px solid #3A3A3A;">
            <h3 style="margin: 0 0 15px 0; color: #000;">You will receive emails for:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${notificationList}
            </ul>
          </div>
          
          ${enabledNotifications.length > 0 ? `
          <div style="background-color:#161616; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0;"><strong>What this means:</strong></p>
            <p style="margin: 5px 0 0 0;">You will receive email notifications whenever the events listed above occur in the 1stRep platform. This helps you stay informed about important updates in real-time.</p>
          </div>
          ` : `
          <div style="background-color:#161616; padding: 15px; margin: 20px 0; border-radius: 5px; border:1px solid #3A3A3A;">
            <p style="margin: 0;"><strong>No notifications enabled</strong></p>
            <p style="margin: 5px 0 0 0;">You will not receive any email notifications. Contact your administrator if you believe this is a mistake.</p>
          </div>
          `}
          
          <p>If you have any questions about these settings, please contact your administrator.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/admin" style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Admin Dashboard</a>
          </div>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The 1stRep Team</strong></p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 0.9em; color:#B0B0B0;">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} 1stRep. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;"><a href="${siteUrl}" style="color:#B0B0B0;">${siteUrl}</a></p>
        </div>
      </body>
      </html>
    `,
  };
};

// Back-in-stock notification email for customers who subscribed
export const sendBackInStockEmail = async (details: {
  customerEmail: string;
  customerName: string;
  productName: string;
  productUrl: string;
  size?: string;
  color?: string;
}) => {
  try {
    const siteUrl = getSiteUrl();
    const variantInfo = [details.size, details.color].filter(Boolean).join(' / ');
    const subject = `Back in Stock: ${details.productName}${variantInfo ? ` (${variantInfo})` : ''}`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #080808; color: #FAFAF8; padding: 20px; text-align: center;">
    <h1 style="margin: 0; letter-spacing: 2px;">1STREP</h1>
  </div>

  <div style="padding: 30px; background-color: #f9f9f9;">
    <p>Hi ${details.customerName},</p>
    <p>Great news — the item you were waiting for is back in stock!</p>

    <div style="background-color: #161616; color: #FAFAF8; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #3A3A3A;">
      <p style="margin: 0; font-size: 18px; font-weight: bold;">${details.productName}</p>
      ${variantInfo ? `<p style="margin: 8px 0 0 0; color: #B0B0B0;">${variantInfo}</p>` : ''}
      <p style="margin: 12px 0 0 0; color: #B0B0B0; font-size: 14px;">Now available — grab it before it sells out again.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${details.productUrl}" style="background-color: #080808; color: #FAFAF8; padding: 14px 36px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; letter-spacing: 1px;">SHOP NOW</a>
    </div>

    <p style="font-size: 13px; color: #6E6E6E;">Stock is limited, so act fast. This notification was sent because you signed up for a back-in-stock alert on this item.</p>
  </div>

  <div style="background-color: #080808; padding: 20px; text-align: center; font-size: 12px; color: #6E6E6E;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} 1stRep. All rights reserved.</p>
    <p style="margin: 6px 0 0 0;"><a href="${siteUrl}" style="color: #B0B0B0; text-decoration: none;">${siteUrl}</a></p>
  </div>
</body>
</html>`;

    const success = await sendEmailViaGmail(details.customerEmail, subject, html);
    if (success) {
      console.log(`📧 Back-in-stock email sent to ${details.customerEmail} for "${details.productName}"`);
    }
    return success;
  } catch (error) {
    console.error('Error sending back-in-stock email:', error);
    return false;
  }
};

// Send notification settings updated email to team member
export const sendNotificationSettingsUpdatedEmail = async (details: {
  teamMemberName: string;
  teamMemberEmail: string;
  notifications: {
    newOrders: boolean;
    shipping: boolean;
    delivery: boolean;
    lowStock: boolean;
    supportTickets: boolean;
  };
}) => {
  try {
    const mailOptions = createNotificationSettingsUpdatedEmail(details);
    const success = await sendEmailViaGmail(
      mailOptions.to,
      mailOptions.subject,
      mailOptions.html
    );
    return { success, messageId: success ? 'gmail-api' : undefined };
  } catch (error) {
    console.error('Error sending notification settings updated email:', error);
    throw error;
  }
};
