import { google } from 'googleapis';
import nodemailer from 'nodemailer';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getGmailClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// RFC 2047 encode the subject so non-ASCII characters (em dashes, accents, etc.)
// survive intact instead of being mangled into mojibake by mail clients.
function encodeSubject(subject: string): string {
  if (/^[\x00-\x7F]*$/.test(subject)) return subject; // pure ASCII — no encoding needed
  return `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
}

function createEmailMessage(to: string, subject: string, htmlBody: string): string {
  // Do NOT set a From: header — Gmail API sets it automatically from the authenticated account.
  // Setting From: to a non-verified alias causes internal NDRs from Gmail.
  const emailLines = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${encodeSubject(subject)}`,
    '',
    htmlBody
  ];
  const email = emailLines.join('\r\n');
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendEmailViaSmtp(to: string, subject: string, htmlBody: string): Promise<boolean> {
  const password = process.env.SMTP_PASSWORD;
  if (!password) return false;

  const host = process.env.SMTP_HOST || 'smtp.123-reg.co.uk';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || 'info@1strep.com';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });

  await transporter.sendMail({
    from: `1stRep <${user}>`,
    to,
    subject,
    html: htmlBody,
  });
  return true;
}

export async function sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
  try {
    if (process.env.SMTP_PASSWORD) {
      try {
        await sendEmailViaSmtp(to, subject, htmlBody);
        console.log(`[SMTP] Email sent to ${to}: ${subject}`);
        return true;
      } catch (smtpError: any) {
        console.warn(`[SMTP] Failed (${smtpError.message}), falling back to Gmail API`);
      }
    }
    const gmail = await getGmailClient();
    const encodedMessage = createEmailMessage(to, subject, htmlBody);
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });
    console.log(`[Gmail] Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
}

/** Retry sendEmail up to maxAttempts times with exponential backoff. */
export async function sendEmailWithRetry(
  to: string,
  subject: string,
  htmlBody: string,
  maxAttempts = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ok = await sendEmail(to, subject, htmlBody);
    if (ok) return true;
    if (attempt < maxAttempts) {
      const delay = attempt * 1500; // 1.5s, 3s
      console.warn(`[Email] Attempt ${attempt}/${maxAttempts} failed for ${to}. Retrying in ${delay}ms…`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  console.error(`[Email] All ${maxAttempts} attempts failed for ${to}: ${subject}`);
  return false;
}

const emailHeader = `
  <tr>
    <td style="background-color:#080808; padding:0; border-bottom:2px solid #FAFAF8;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:32px 40px; text-align:center;">
            <img
              src="https://1strep.com/1strep-header-logo.png"
              alt="1stRep"
              width="140"
              style="display:inline-block; max-width:140px; height:auto;"
              onerror="this.style.display='none'; this.nextSibling.style.display='inline-block';"
            />
            <span style="display:none; color:#FAFAF8; font-size:28px; font-weight:900; letter-spacing:-1px; font-family:Inter,Arial,sans-serif;">1stRep</span>
            <p style="color:#6E6E6E; margin:10px 0 0; font-size:11px; letter-spacing:3px; text-transform:uppercase; font-family:Inter,Arial,sans-serif;">Wear Your Standards</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

const emailFooter = `
  <tr>
    <td style="background-color:#080808; padding:0; border-top:1px solid #3A3A3A;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:28px 40px; text-align:center;">
            <img src="https://1strep.com/1strep-header-logo.png" alt="1stRep" width="90" style="display:inline-block; max-width:90px; height:auto; opacity:0.65; margin-bottom:14px;" />
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
              <tr>
                <td style="padding:0 10px;"><a href="https://instagram.com/1strep" style="color:#6E6E6E; text-decoration:none; font-size:11px; font-family:Inter,Arial,sans-serif;">Instagram</a></td>
                <td style="color:#3A3A3A; font-size:11px;">|</td>
                <td style="padding:0 10px;"><a href="https://tiktok.com/@1strep" style="color:#6E6E6E; text-decoration:none; font-size:11px; font-family:Inter,Arial,sans-serif;">TikTok</a></td>
                <td style="color:#3A3A3A; font-size:11px;">|</td>
                <td style="padding:0 10px;"><a href="https://1strep.com" style="color:#6E6E6E; text-decoration:none; font-size:11px; font-family:Inter,Arial,sans-serif;">1strep.com</a></td>
                <td style="color:#3A3A3A; font-size:11px;">|</td>
                <td style="padding:0 10px;"><a href="mailto:info@1strep.com" style="color:#6E6E6E; text-decoration:none; font-size:11px; font-family:Inter,Arial,sans-serif;">info@1strep.com</a></td>
              </tr>
            </table>
            <p style="color:#3A3A3A; margin:0 0 4px; font-size:10px; font-family:Inter,Arial,sans-serif;">1stRep Ltd &nbsp;&bull;&nbsp; United Kingdom</p>
            <p style="color:#3A3A3A; margin:0; font-size:10px; font-family:Inter,Arial,sans-serif;">
              &copy; ${new Date().getFullYear()} 1stRep. All rights reserved. &nbsp;&bull;&nbsp;
              <a href="https://1strep.com/privacy" style="color:#3A3A3A; text-decoration:none;">Privacy Policy</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

export function wrapEmailTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>1stRep</title>
</head>
<body style="margin:0; padding:0; background-color:#080808; font-family:Inter,Arial,sans-serif; -webkit-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#080808; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#0F0F0F; border-radius:0; overflow:hidden; border:1px solid #3A3A3A;">
          ${emailHeader}
          ${content}
          ${emailFooter}
        </table>
        <p style="color: #3A3A3A; font-size: 11px; margin: 20px 0 0; text-align: center; font-family: Inter,'Helvetica Neue',Arial,sans-serif;">
          You received this email because you have an account or application with 1stRep.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function ctaButton(text: string, url: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:20px auto;">
      <tr>
        <td style="background-color:#FAFAF8; border-radius:3px;">
          <a href="${url}" style="display:inline-block; padding:12px 32px; color:#080808; text-decoration:none; font-weight:700; font-size:14px; letter-spacing:1px; font-family:Inter,Arial,sans-serif; text-transform:uppercase;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// 1. Newsletter Welcome Email
export async function sendNewsletterWelcomeEmail(email: string, firstName?: string | null): Promise<boolean> {
  const name = firstName || 'there';
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Welcome to the 1stRep Family!</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">Hey ${name},</p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          We're thrilled to have you join our community of athletes who never settle for ordinary.
        </p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">As a subscriber, you'll be the first to know about:</p>
        <ul style="color: #B0B0B0; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
          <li>New collection drops</li>
          <li>Exclusive member-only offers</li>
          <li>Training tips from our athletes</li>
          <li>Early access to limited editions</li>
        </ul>
        ${ctaButton('Shop Now', 'https://1strep.com/shop-clean')}
      </td>
    </tr>
  `;
  return sendEmail(email, 'Welcome to the 1stRep Family!', wrapEmailTemplate(content));
}

// 2. Account Welcome Email
export async function sendAccountWelcomeEmail(email: string, name: string): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Welcome to 1stRep!</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">Hi ${name},</p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Your 1stRep account has been created successfully. You're now part of our community of athletes who push their limits every day.
        </p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">With your account, you can:</p>
        <ul style="color: #B0B0B0; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
          <li>Track your orders in real-time</li>
          <li>Save items to your wishlist</li>
          <li>Earn loyalty points on every purchase</li>
          <li>Access exclusive member discounts</li>
        </ul>
        ${ctaButton('Start Shopping', 'https://1strep.com/shop-clean')}
      </td>
    </tr>
  `;
  return sendEmail(email, 'Welcome to 1stRep - Your Account is Ready!', wrapEmailTemplate(content));
}

// 3. Order Confirmation Email
export async function sendOrderConfirmationEmail(details: {
  email: string;
  customerName: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  shippingAddress: string;
}): Promise<boolean> {
  const itemsHtml = details.items.map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #B0B0B0;">${item.name}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #B0B0B0; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #B0B0B0; text-align: right;">£${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Order Confirmed!</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">Hi ${details.customerName},</p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Thank you for your order! We're preparing your items and will notify you when they ship.
        </p>
        <div style="background-color: #0f0f0f; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color:#FAFAF8; margin: 0 0 10px; font-size: 14px;">ORDER NUMBER</p>
          <p style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">${details.orderNumber}</p>
        </div>
        <table width="100%" style="margin: 20px 0;">
          <tr style="border-bottom: 2px solid #333;">
            <th style="text-align: left; padding: 10px 0; color: #6E6E6E;">Item</th>
            <th style="text-align: center; padding: 10px 0; color: #6E6E6E;">Qty</th>
            <th style="text-align: right; padding: 10px 0; color: #6E6E6E;">Price</th>
          </tr>
          ${itemsHtml}
          <tr>
            <td colspan="2" style="padding: 15px 0; color: #ffffff; font-weight: 600;">Total</td>
            <td style="padding: 15px 0; color:#FAFAF8; font-weight: 700; text-align: right; font-size: 18px;">£${details.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
        <div style="background-color: #0f0f0f; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #6E6E6E; margin: 0 0 10px; font-size: 14px;">SHIPPING ADDRESS</p>
          <p style="color: #B0B0B0; margin: 0; white-space: pre-line;">${details.shippingAddress}</p>
        </div>
        ${ctaButton('Track Order', 'https://1strep.com/order-tracking')}
      </td>
    </tr>
  `;
  return sendEmail(details.email, `Order Confirmed - #${details.orderNumber}`, wrapEmailTemplate(content));
}

// 4. Shipping Notification Email
export async function sendShippingNotificationEmail(details: {
  email: string;
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery?: string;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Your Order Has Shipped!</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">Hi ${details.customerName},</p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Great news! Your order is on its way to you.
        </p>
        <div style="background-color: #0f0f0f; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table width="100%">
            <tr>
              <td style="padding: 10px 0;">
                <p style="color: #6E6E6E; margin: 0; font-size: 12px;">ORDER NUMBER</p>
                <p style="color: #ffffff; margin: 5px 0 0; font-weight: 600;">${details.orderNumber}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <p style="color: #6E6E6E; margin: 0; font-size: 12px;">CARRIER</p>
                <p style="color: #ffffff; margin: 5px 0 0; font-weight: 600;">${details.carrier}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <p style="color: #6E6E6E; margin: 0; font-size: 12px;">TRACKING NUMBER</p>
                <p style="color:#FAFAF8; margin: 5px 0 0; font-weight: 600;">${details.trackingNumber}</p>
              </td>
            </tr>
            ${details.estimatedDelivery ? `
            <tr>
              <td style="padding: 10px 0;">
                <p style="color: #6E6E6E; margin: 0; font-size: 12px;">ESTIMATED DELIVERY</p>
                <p style="color:#FAFAF8; margin: 5px 0 0; font-weight: 600;">${details.estimatedDelivery}</p>
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
        ${ctaButton('Track Package', 'https://1strep.com/order-tracking')}
      </td>
    </tr>
  `;
  return sendEmail(details.email, `Your Order Has Shipped - #${details.orderNumber}`, wrapEmailTemplate(content));
}

// 5. Password Reset Email
export async function sendPasswordResetEmail(details: {
  email: string;
  name: string;
  resetUrl: string;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Reset Your Password</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">Hi ${details.name},</p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <div style="background-color:#161616; padding:15px; border-radius:3px; margin:20px 0; border:1px solid #3A3A3A;">
          <p style="color: #B0B0B0; margin: 0; font-size: 14px;">
            <strong>Important:</strong> This link will expire in 1 hour for security reasons.
          </p>
        </div>
        ${ctaButton('Reset Password', details.resetUrl)}
        <p style="color: #6E6E6E; line-height: 1.6; margin: 20px 0 0; font-size: 13px;">
          If you didn't request this password reset, you can safely ignore this email.
        </p>
      </td>
    </tr>
  `;
  return sendEmail(details.email, 'Reset Your Password - 1stRep', wrapEmailTemplate(content));
}

// 6. Abandoned Cart Email
export async function sendAbandonedCartEmail(details: {
  email: string;
  firstName?: string;
  cartValue: string;
  itemCount: number;
}): Promise<boolean> {
  const name = details.firstName || 'there';
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">You Left Something Behind!</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">Hey ${name},</p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          We noticed you left ${details.itemCount} item${details.itemCount > 1 ? 's' : ''} in your cart worth <strong style="color:#FAFAF8;">£${details.cartValue}</strong>.
        </p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Don't let these performance essentials slip away! Complete your order before they sell out.
        </p>
        <div style="background-color:#161616; padding:15px; border-radius:3px; margin:20px 0; border:1px solid #3A3A3A;">
          <p style="color: #B0B0B0; margin: 0; font-size: 14px;">
            <strong>Tip:</strong> Use code <strong>COMEBACK10</strong> for 10% off your order!
          </p>
        </div>
        ${ctaButton('Complete Your Order', 'https://1strep.com/cart')}
      </td>
    </tr>
  `;
  return sendEmail(details.email, 'You Left Something in Your Cart!', wrapEmailTemplate(content));
}

// 7. Reseller Application Received Email
export async function sendResellerApplicationEmail(details: {
  email: string;
  name: string;
  businessName: string;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Application Received!</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">Hi ${details.name},</p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Thank you for applying to become a 1stRep reseller! We've received your application for <strong style="color: #ffffff;">${details.businessName}</strong>.
        </p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Our team will review your application and get back to you within 2-3 business days.
        </p>
        <div style="background-color: #0f0f0f; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #6E6E6E; margin: 0 0 15px; font-size: 14px;">WHAT'S NEXT?</p>
          <ul style="color: #B0B0B0; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Our team reviews your application</li>
            <li>We may contact you for additional information</li>
            <li>You'll receive an approval or feedback email</li>
          </ul>
        </div>
      </td>
    </tr>
  `;
  return sendEmail(details.email, 'Reseller Application Received - 1stRep', wrapEmailTemplate(content));
}

// 8. Reseller Approved Email
export async function sendResellerApprovedEmail(details: {
  email: string;
  name: string;
  tier: string;
  discountPercentage: number;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color:#FAFAF8; margin: 0 0 20px; font-size: 24px;">Congratulations! You're Approved!</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">Hi ${details.name},</p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Great news! Your application to become a 1stRep reseller has been approved!
        </p>
        <div style="background-color:#161616; padding:20px; border-radius:3px; margin:20px 0; border:1px solid #3A3A3A;">
          <table width="100%">
            <tr>
              <td style="padding: 10px 0;">
                <p style="color: #B0B0B0; margin: 0; font-size: 12px;">YOUR TIER</p>
                <p style="color: #ffffff; margin: 5px 0 0; font-weight: 700; font-size: 18px;">${details.tier}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <p style="color: #B0B0B0; margin: 0; font-size: 12px;">YOUR DISCOUNT</p>
                <p style="color:#FAFAF8; margin: 5px 0 0; font-weight: 700; font-size: 24px;">${details.discountPercentage}% OFF</p>
              </td>
            </tr>
          </table>
        </div>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          You can now access the reseller portal to browse products, place orders, and manage your account.
        </p>
        ${ctaButton('Access Reseller Portal', 'https://1strep.com/reseller/login')}
      </td>
    </tr>
  `;
  return sendEmail(details.email, 'Welcome to the 1stRep Reseller Program!', wrapEmailTemplate(content));
}

// 9. Reseller Rejected Email
export async function sendResellerRejectedEmail(details: {
  email: string;
  name: string;
  reason?: string;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Application Update</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">Hi ${details.name},</p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Thank you for your interest in becoming a 1stRep reseller. After careful review, we're unable to approve your application at this time.
        </p>
        ${details.reason ? `
        <div style="background-color: #0f0f0f; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #6E6E6E; margin: 0 0 10px; font-size: 12px;">FEEDBACK</p>
          <p style="color: #B0B0B0; margin: 0;">${details.reason}</p>
        </div>
        ` : ''}
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          You're welcome to reapply in the future as your business grows. In the meantime, you can still enjoy our products as a retail customer.
        </p>
        ${ctaButton('Shop as Customer', 'https://1strep.com/shop-clean')}
      </td>
    </tr>
  `;
  return sendEmail(details.email, 'Your 1stRep Reseller Application', wrapEmailTemplate(content));
}

// 10. Referral Invitation Email
export async function sendReferralInvitationEmail(details: {
  email: string;
  senderName: string;
  referralCode: string;
  discountValue: string;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">You've Been Invited!</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Your friend <strong style="color: #ffffff;">${details.senderName}</strong> thinks you'll love 1stRep premium fitness apparel!
        </p>
        <div style="background-color: #1e1b4b; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #6366f1;">
          <p style="color: #c7d2fe; margin: 0 0 10px; font-size: 14px;">YOUR EXCLUSIVE CODE</p>
          <p style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">${details.referralCode}</p>
          <p style="color: #a5b4fc; margin: 15px 0 0; font-size: 16px;">Get <strong>${details.discountValue}</strong> off your first order!</p>
        </div>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Join thousands of athletes who trust 1stRep for premium activewear that delivers results.
        </p>
        ${ctaButton('Claim Your Discount', `https://1strep.com/shop-clean?ref=${details.referralCode}`)}
      </td>
    </tr>
  `;
  return sendEmail(details.email, `${details.senderName} Invited You to 1stRep!`, wrapEmailTemplate(content));
}

// 11. Admin Team Invitation Email
export async function sendAdminTeamInvitationEmail(details: {
  email: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">You're Invited to Join the Team!</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          <strong style="color: #ffffff;">${details.inviterName}</strong> has invited you to join the 1stRep admin team.
        </p>
        <div style="background-color: #0f0f0f; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #6E6E6E; margin: 0 0 10px; font-size: 12px;">YOUR ROLE</p>
          <p style="color:#FAFAF8; margin: 0; font-size: 18px; font-weight: 600;">${details.role}</p>
        </div>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Click the button below to accept the invitation and set up your admin account.
        </p>
        <div style="background-color:#161616; padding:15px; border-radius:3px; margin:20px 0; border:1px solid #3A3A3A;">
          <p style="color: #B0B0B0; margin: 0; font-size: 14px;">
            This invitation expires in 7 days.
          </p>
        </div>
        ${ctaButton('Accept Invitation', details.inviteUrl)}
      </td>
    </tr>
  `;
  return sendEmail(details.email, 'Invitation to Join 1stRep Admin Team', wrapEmailTemplate(content));
}

// 12. Review Request Email
export async function sendReviewRequestEmail(details: {
  email: string;
  customerName: string;
  orderNumber: string;
  productName: string;
  reviewUrl: string;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">How Did We Do?</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">Hi ${details.customerName},</p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          We hope you're loving your recent purchase! We'd love to hear your thoughts on:
        </p>
        <div style="background-color: #0f0f0f; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">${details.productName}</p>
          <p style="color: #6E6E6E; margin: 10px 0 0; font-size: 14px;">From Order #${details.orderNumber}</p>
        </div>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Your review helps other athletes make informed decisions and helps us improve our products.
        </p>
        ${ctaButton('Write a Review', details.reviewUrl)}
      </td>
    </tr>
  `;
  return sendEmail(details.email, 'Share Your Experience with 1stRep', wrapEmailTemplate(content));
}

// Send all test emails to a specific address
export async function sendAllTestEmails(testEmail: string): Promise<{
  type: string;
  success: boolean;
}[]> {
  const results: { type: string; success: boolean }[] = [];

  // 1. Newsletter Welcome
  results.push({
    type: 'Newsletter Welcome',
    success: await sendNewsletterWelcomeEmail(testEmail, 'Shahzad')
  });

  // 2. Account Welcome
  results.push({
    type: 'Account Welcome',
    success: await sendAccountWelcomeEmail(testEmail, 'Shahzad')
  });

  // 3. Order Confirmation
  results.push({
    type: 'Order Confirmation',
    success: await sendOrderConfirmationEmail({
      email: testEmail,
      customerName: 'Shahzad',
      orderNumber: 'ORD-2024-001234',
      items: [
        { name: 'Tactical Performance Hoodie - Black (L)', quantity: 1, price: 89.99 },
        { name: 'Compression Training Tee - Navy (M)', quantity: 2, price: 34.99 }
      ],
      totalAmount: 159.97,
      shippingAddress: 'Shahzad\n123 Test Street\nLondon, SW1A 1AA\nUnited Kingdom'
    })
  });

  // 4. Shipping Notification
  results.push({
    type: 'Shipping Notification',
    success: await sendShippingNotificationEmail({
      email: testEmail,
      customerName: 'Shahzad',
      orderNumber: 'ORD-2024-001234',
      trackingNumber: 'RM123456789GB',
      carrier: 'Royal Mail',
      estimatedDelivery: 'December 20, 2024'
    })
  });

  // 5. Password Reset
  results.push({
    type: 'Password Reset',
    success: await sendPasswordResetEmail({
      email: testEmail,
      name: 'Shahzad',
      resetUrl: 'https://1strep.com/reset-password?token=abc123xyz'
    })
  });

  // 6. Abandoned Cart
  results.push({
    type: 'Abandoned Cart',
    success: await sendAbandonedCartEmail({
      email: testEmail,
      firstName: 'Shahzad',
      cartValue: '124.99',
      itemCount: 3
    })
  });

  // 7. Reseller Application
  results.push({
    type: 'Reseller Application',
    success: await sendResellerApplicationEmail({
      email: testEmail,
      name: 'Shahzad',
      businessName: 'Shahzad Fitness Store'
    })
  });

  // 8. Reseller Approved
  results.push({
    type: 'Reseller Approved',
    success: await sendResellerApprovedEmail({
      email: testEmail,
      name: 'Shahzad',
      tier: 'Gold Partner',
      discountPercentage: 25
    })
  });

  // 9. Reseller Rejected
  results.push({
    type: 'Reseller Rejected',
    success: await sendResellerRejectedEmail({
      email: testEmail,
      name: 'Shahzad',
      reason: 'We require a minimum of 6 months of business operation history.'
    })
  });

  // 10. Referral Invitation
  results.push({
    type: 'Referral Invitation',
    success: await sendReferralInvitationEmail({
      email: testEmail,
      senderName: 'John Doe',
      referralCode: 'FRIEND20',
      discountValue: '20%'
    })
  });

  // 11. Admin Team Invitation
  results.push({
    type: 'Admin Team Invitation',
    success: await sendAdminTeamInvitationEmail({
      email: testEmail,
      inviterName: 'Admin Manager',
      role: 'Marketing Manager',
      inviteUrl: 'https://1strep.com/admin/accept-invite?token=xyz789'
    })
  });

  // 12. Review Request
  results.push({
    type: 'Review Request',
    success: await sendReviewRequestEmail({
      email: testEmail,
      customerName: 'Shahzad',
      orderNumber: 'ORD-2024-001234',
      productName: 'Tactical Performance Hoodie - Black (L)',
      reviewUrl: 'https://1strep.com/review/product/123'
    })
  });

  return results;
}

// Wholesale order payment confirmation email
export async function sendWholesaleOrderPaymentEmail(params: {
  email: string;
  businessName: string;
  orderNumber: string;
  totalAmount: string;
  itemCount: number;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Payment Confirmed!</h2>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Dear ${params.businessName},
        </p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
          Thank you for your payment! Your wholesale order has been confirmed and is now being processed.
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #262626; border-radius: 8px; margin: 20px 0;">
          <tr>
            <td style="padding: 20px;">
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Order Number</p>
              <p style="color: #ffffff; margin: 0 0 15px; font-size: 18px; font-weight: 600;">${params.orderNumber}</p>
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Items Ordered</p>
              <p style="color: #ffffff; margin: 0 0 15px; font-size: 16px;">${params.itemCount} items</p>
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Total Amount</p>
              <p style="color:#FAFAF8; margin: 0; font-size: 24px; font-weight: 700;">£${params.totalAmount}</p>
            </td>
          </tr>
        </table>
        
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 20px 0;">
          Our team will now process your order and prepare it for dispatch. You will receive a shipping notification once your order is on its way.
        </p>
        
        ${ctaButton('View Order', `https://1strep.com/wholesaler/dashboard`)}
        
        <p style="color: #6E6E6E; font-size: 12px; margin: 20px 0 0; text-align: center;">
          If you have any questions about your order, please contact our wholesale support team.
        </p>
      </td>
    </tr>
  `;
  
  return sendEmail(
    params.email, 
    `Payment Confirmed - Wholesale Order ${params.orderNumber}`, 
    wrapEmailTemplate(content)
  );
}

// Admin notification for wholesale order payment
export async function sendWholesaleOrderAdminNotificationEmail(params: {
  orderNumber: string;
  businessName: string;
  totalAmount: string;
  itemCount: number;
}): Promise<boolean> {
  const adminEmail = 'info@1strep.com';
  
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">New Wholesale Order Payment</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
          A wholesale order has been paid and is ready for processing.
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #262626; border-radius: 8px; margin: 20px 0;">
          <tr>
            <td style="padding: 20px;">
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Order Number</p>
              <p style="color: #ffffff; margin: 0 0 15px; font-size: 18px; font-weight: 600;">${params.orderNumber}</p>
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Wholesaler</p>
              <p style="color: #ffffff; margin: 0 0 15px; font-size: 16px;">${params.businessName}</p>
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Items</p>
              <p style="color: #ffffff; margin: 0 0 15px; font-size: 16px;">${params.itemCount} items</p>
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Total Amount</p>
              <p style="color:#FAFAF8; margin: 0; font-size: 24px; font-weight: 700;">£${params.totalAmount}</p>
            </td>
          </tr>
        </table>
        
        ${ctaButton('View Order', `https://1strep.com/admin`)}
        
        <p style="color: #6E6E6E; font-size: 12px; margin: 20px 0 0; text-align: center;">
          Please process this order promptly.
        </p>
      </td>
    </tr>
  `;
  
  return sendEmail(
    adminEmail, 
    `[ACTION REQUIRED] Wholesale Order Paid - ${params.orderNumber}`, 
    wrapEmailTemplate(content)
  );
}

// Reseller subscription activation email
export async function sendSubscriptionActivatedEmail(params: {
  email: string;
  businessName: string;
  tier: string;
  amount: string;
  nextBillingDate: string;
}): Promise<boolean> {
  const tierNames: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold'
  };
  
  const tierProducts: Record<string, string> = {
    bronze: 'Up to 10 products',
    silver: 'Up to 20 products',
    gold: 'Unlimited products'
  };
  
  const tierName = tierNames[params.tier] || params.tier;
  const productLimit = tierProducts[params.tier] || 'Products';
  
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Welcome to ${tierName} Tier!</h2>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Dear ${params.businessName},
        </p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
          Your subscription has been activated. You can now start adding and selling your own products through our platform.
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #262626; border-radius: 8px; margin: 20px 0;">
          <tr>
            <td style="padding: 20px;">
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Your Plan</p>
              <p style="color: #ffffff; margin: 0 0 15px; font-size: 20px; font-weight: 600;">${tierName} Tier</p>
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Product Limit</p>
              <p style="color: #ffffff; margin: 0 0 15px; font-size: 16px;">${productLimit}</p>
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Monthly Payment</p>
              <p style="color:#FAFAF8; margin: 0 0 15px; font-size: 24px; font-weight: 700;">£${params.amount}</p>
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Next Billing Date</p>
              <p style="color: #ffffff; margin: 0; font-size: 14px;">${params.nextBillingDate}</p>
            </td>
          </tr>
        </table>
        
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 20px 0;">
          Your card will be automatically charged £${params.amount} each month. You can manage your subscription from your dashboard at any time.
        </p>
        
        ${ctaButton('Go to Dashboard', `https://1strep.com/reseller/dashboard`)}
        
        <p style="color: #6E6E6E; font-size: 12px; margin: 20px 0 0; text-align: center;">
          If you have any questions about your subscription, please contact our support team.
        </p>
      </td>
    </tr>
  `;
  
  return sendEmail(
    params.email, 
    `Your ${tierName} Subscription is Now Active - 1stRep`, 
    wrapEmailTemplate(content)
  );
}

// Monthly subscription renewal notification email
export async function sendSubscriptionRenewalEmail(params: {
  email: string;
  businessName: string;
  tier: string;
  amount: string;
  billingDate: string;
}): Promise<boolean> {
  const tierNames: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold'
  };
  
  const tierName = tierNames[params.tier] || params.tier;
  
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 24px;">Subscription Payment Processed</h2>
        <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Dear ${params.businessName},
        </p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
          Your monthly subscription payment has been successfully processed.
        </p>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #262626; border-radius: 8px; margin: 20px 0;">
          <tr>
            <td style="padding: 20px;">
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Plan</p>
              <p style="color: #ffffff; margin: 0 0 15px; font-size: 18px; font-weight: 600;">${tierName} Tier</p>
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Amount Charged</p>
              <p style="color:#FAFAF8; margin: 0 0 15px; font-size: 24px; font-weight: 700;">£${params.amount}</p>
              <p style="color: #94a3b8; margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Billing Date</p>
              <p style="color: #ffffff; margin: 0; font-size: 14px;">${params.billingDate}</p>
            </td>
          </tr>
        </table>
        
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 20px 0;">
          Thank you for continuing with 1stRep. Your subscription remains active and you can continue selling your products.
        </p>
        
        ${ctaButton('View Dashboard', `https://1strep.com/reseller/dashboard`)}
      </td>
    </tr>
  `;
  
  return sendEmail(
    params.email, 
    `Payment Receipt - ${tierName} Subscription Renewal`, 
    wrapEmailTemplate(content)
  );
}

// Influencer: Application received confirmation
export async function sendInfluencerApplicationReceivedEmail(details: {
  email: string;
  name: string;
  sport: string;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color:#FAFAF8; margin: 0 0 20px; font-size: 24px;">Application Received!</h2>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">Hi ${details.name},</p>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 0 0 20px;">
          Thank you for applying to the <strong style="color: #ffffff;">1stRep Influencer Programme</strong>.
          We've received your application and our team will review it within <strong style="color:#FAFAF8;">7 days</strong>.
        </p>
        <div style="background-color:#161616; padding:20px; border:1px solid #3A3A3A; margin:20px 0;">
          <p style="color: #6E6E6E; margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Your Application</p>
          <p style="color: #ffffff; margin: 0 0 4px;"><strong>Name:</strong> ${details.name}</p>
          <p style="color: #ffffff; margin: 0;"><strong>Sport / Discipline:</strong> ${details.sport}</p>
        </div>
        <p style="color: #B0B0B0; line-height: 1.6; margin: 20px 0;">
          If your application is approved, you'll receive another email with your login details, access to create your own coupon codes, and your <strong style="color:#FAFAF8;">100 welcome credits</strong>.
        </p>
        <p style="color: #6E6E6E; font-size: 14px; line-height: 1.6; margin: 0;">
          In the meantime, feel free to keep browsing our range at <a href="https://1strep.com" style="color:#FAFAF8;">1strep.com</a>.
        </p>
      </td>
    </tr>
  `;
  return sendEmail(details.email, 'Your 1stRep Influencer Application — Received', wrapEmailTemplate(content));
}

// Influencer: Approved — professional template with password setup CTA
export async function sendInfluencerApprovedEmail(details: {
  email: string;
  name: string;
  discountCode: string;
  tempPassword?: string | null;
  isNewAccount: boolean;
}): Promise<boolean> {
  const encodedEmail = encodeURIComponent(details.email);
  const setPasswordUrl = `https://1strep.com/forgot-password?email=${encodedEmail}`;

  const accessSection = details.isNewAccount ? `
    <!-- New account: set password CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
      <tr>
        <td style="background-color: #080808; border:1px solid #3A3A3A; border-radius: 4px; padding: 24px 28px;">
          <p style="color:#FAFAF8; margin: 0 0 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Step 1 &mdash; Set Your Password</p>
          <p style="color: #ffffff; margin: 0 0 4px; font-size: 15px; font-weight: 600;">Your account has been created using:</p>
          <p style="color:#FAFAF8; margin: 0 0 16px; font-size: 16px; font-weight: 700;">${details.email}</p>
          <p style="color: #6E6E6E; margin: 0 0 20px; font-size: 13px; line-height: 1.6;">
            Click the button below to set your password. We&rsquo;ll send a one-time verification code to your email — it only takes 60 seconds.
          </p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background-color:#FAFAF8; border-radius:3px;">
                <a href="${setPasswordUrl}" style="display: inline-block; padding: 13px 28px; color: #080808; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">
                  Set My Password &rarr;
                </a>
              </td>
            </tr>
          </table>
          <p style="color: #4b5563; margin: 14px 0 0; font-size: 11px;">
            Then log in at <a href="https://1strep.com/login" style="color:#FAFAF8; text-decoration: none;">1strep.com/login</a> to access your dashboard.
          </p>
        </td>
      </tr>
    </table>
  ` : `
    <!-- Existing account: direct access CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
      <tr>
        <td style="background-color: #080808; border: 1px solid #2a2a2a; border-radius: 4px; padding: 20px 28px;">
          <p style="color: #6E6E6E; margin: 0 0 8px; font-size: 13px; line-height: 1.6;">
            Log in using your existing 1stRep account at <strong style="color:#FAFAF8;">${details.email}</strong> — your dashboard is ready immediately.
          </p>
        </td>
      </tr>
    </table>
  `;

  const content = `
    <tr>
      <td style="padding: 40px 40px 0;">
        <!-- Hero headline -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
          <tr>
            <td style="border:1px solid #3A3A3A; padding-left: 16px;">
              <p style="color:#FAFAF8; margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 700;">Influencer Programme</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; line-height: 1.1;">You&rsquo;re Approved!</h1>
              <p style="color: #6E6E6E; margin: 6px 0 0; font-size: 14px;">Welcome to Team 1stRep, ${details.name}.</p>
            </td>
          </tr>
        </table>

        <p style="color: #B0B0B0; line-height: 1.7; margin: 0 0 8px; font-size: 15px;">
          Congratulations — your application to the <strong style="color: #ffffff;">1stRep Influencer Programme</strong> has been approved. Your account is live and your <strong style="color:#FAFAF8;">100 welcome credits</strong> have been added.
        </p>
      </td>
    </tr>

    <!-- Password / Access section -->
    <tr>
      <td style="padding: 0 40px;">
        ${accessSection}
      </td>
    </tr>

    <!-- Benefits -->
    <tr>
      <td style="padding: 0 40px 40px;">
        <p style="color:#FAFAF8; margin: 0 0 16px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Your Programme Benefits</p>

        <!-- Welcome credit -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
          <tr>
            <td style="background-color: #080808; padding: 18px 20px; border-radius: 4px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color: #6E6E6E; margin: 0 0 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Welcome Credit</p>
                    <p style="color:#FAFAF8; margin: 0; font-size: 22px; font-weight: 900;">100 Welcome Credits</p>
                    <p style="color: #6E6E6E; margin: 4px 0 0; font-size: 12px;">Already added to your account — 50 credits = £30 to spend</p>
                  </td>
                  <td width="40" style="text-align: right; vertical-align: middle;">
                    <span style="color:#FAFAF8; font-size: 28px;">&#9733;</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Coupon codes -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
          <tr>
            <td style="background-color: #080808; padding: 18px 20px; border-radius: 4px;">
              <p style="color: #6E6E6E; margin: 0 0 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Coupon Codes</p>
              <p style="color: #B0B0B0; margin: 0; font-size: 13px; line-height: 1.6;">Create and share your own custom coupon codes directly from your dashboard. Give your followers exclusive discounts and earn store credits on every sale they generate.</p>
            </td>
          </tr>
        </table>

        <!-- Distribute credits -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
          <tr>
            <td style="background-color: #080808; padding: 18px 20px; border-radius: 4px;">
              <p style="color: #6E6E6E; margin: 0 0 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Content Credits</p>
              <p style="color: #B0B0B0; margin: 0; font-size: 13px; line-height: 1.6;">Submit your posts through your dashboard and earn store credits for every approved piece of content. Use your credits on any order or save them up.</p>
            </td>
          </tr>
        </table>

        <!-- Dashboard CTA -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#FAFAF8; border-radius:3px;">
                    <a href="https://1strep.com/login?redirect=%2Fathlete%2Fdashboard" style="display: inline-block; padding: 15px 40px; color: #080808; text-decoration: none; font-weight: 900; font-size: 15px; letter-spacing: 0.5px;">
                      Go to My Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #4b5563; font-size: 11px; margin: 12px 0 0; text-align: center;">
                Log in with <strong style="color: #6E6E6E;">${details.email}</strong> to access your dashboard.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
  return sendEmail(details.email, 'You\'re Approved — Welcome to Team 1stRep', wrapEmailTemplate(content));
}

export async function sendInfluencerRejectedEmail(details: {
  email: string;
  name: string;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
          <tr>
            <td style="border:1px solid #3A3A3A; padding-left: 16px;">
              <p style="color:#FAFAF8; margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 700;">Influencer Programme</p>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; line-height: 1.1;">Your Application</h1>
              <p style="color: #6E6E6E; margin: 6px 0 0; font-size: 14px;">Hi ${details.name},</p>
            </td>
          </tr>
        </table>

        <p style="color: #B0B0B0; line-height: 1.7; margin: 0 0 8px; font-size: 15px;">
          Thanks for applying to the <strong style="color: #ffffff;">1stRep Influencer Programme</strong>. After review, we're not able to bring you on board at this time.
        </p>
        <p style="color: #B0B0B0; line-height: 1.7; margin: 16px 0 0; font-size: 15px;">
          This isn't a reflection of you or your platform — we simply can't accept every application right now. We'd genuinely encourage you to apply again in the future.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 40px 40px;">
        <p style="color: #4b5563; font-size: 13px; margin: 0; line-height: 1.6;">
          Questions about this decision? Just reply to this email — a real person will get back to you.
        </p>
      </td>
    </tr>
  `;
  return sendEmail(details.email, 'Your 1stRep Influencer Programme Application', wrapEmailTemplate(content));
}

export async function sendInfluencerApplicationAdminNotificationEmail(details: {
  name: string;
  email: string;
  sport: string;
  instagramHandle?: string;
  followerCount?: string;
}): Promise<boolean> {
  const content = `
    <tr>
      <td style="padding: 40px;">
        <h2 style="color:#FAFAF8; margin: 0 0 8px; font-size: 22px;">New Influencer Application</h2>
        <p style="color: #6E6E6E; margin: 0 0 28px; font-size: 13px;">A new athlete has applied to the 1stRep Influencer Programme.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111111; border-radius: 6px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="color: #6E6E6E; margin: 0 0 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Name</p>
              <p style="color: #ffffff; margin: 0 0 14px; font-size: 15px; font-weight: 600;">${details.name}</p>
              <p style="color: #6E6E6E; margin: 0 0 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Email</p>
              <p style="color:#FAFAF8; margin: 0 0 14px; font-size: 14px;">${details.email}</p>
              <p style="color: #6E6E6E; margin: 0 0 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Sport / Discipline</p>
              <p style="color: #ffffff; margin: 0 0 14px; font-size: 14px;">${details.sport}</p>
              ${details.instagramHandle ? `<p style="color: #6E6E6E; margin: 0 0 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Instagram</p><p style="color: #ffffff; margin: 0 0 14px; font-size: 14px;">@${details.instagramHandle}</p>` : ''}
              ${details.followerCount ? `<p style="color: #6E6E6E; margin: 0 0 2px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Followers</p><p style="color: #ffffff; margin: 0; font-size: 14px;">${details.followerCount}</p>` : ''}
            </td>
          </tr>
        </table>
        ${ctaButton('Review Application', 'https://1strep.com/admin')}
      </td>
    </tr>
  `;
  return sendEmail('info@1strep.com', `New Influencer Application — ${details.name}`, wrapEmailTemplate(content));
}
