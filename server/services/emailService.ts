import nodemailer from 'nodemailer';

interface SendAdminInvitationParams {
  toEmail: string;
  toName: string;
  tempPassword: string;
  departments: string[];
  jobTitle?: string | null;
}

const FONT = `Inter,'Helvetica Neue',Arial,sans-serif`;

class EmailService {
  private createTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  async sendOrderConfirmationEmail(customerEmail: string, details: {
    orderNumber: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    totalAmount: number;
    paymentMethod?: string;
    paypalOrderId?: string;
    storeName?: string;
    fulfilmentMethod?: string;
    deliveryAddress?: { address: string; city: string; postcode: string; country?: string } | null;
  }): Promise<boolean> {
    try {
      const { sendOrderConfirmation } = await import('../email-service');
      const result = await sendOrderConfirmation({
        customerName: 'Customer',
        customerEmail,
        orderNumber: details.orderNumber,
        orderItems: details.items,
        totalAmount: details.totalAmount,
        shippingAddress: details.deliveryAddress
          ? `${details.deliveryAddress.address}\n${details.deliveryAddress.city}, ${details.deliveryAddress.postcode}\n${details.deliveryAddress.country || 'UK'}`
          : (details.fulfilmentMethod || 'Collection'),
      });
      console.log(`Order confirmation email sent to ${customerEmail} via emailService wrapper`);
      return result.success;
    } catch (error) {
      console.error('Failed to send order confirmation email via emailService:', error);
      return false;
    }
  }

  async sendAdminTeamInvitation(params: SendAdminInvitationParams): Promise<boolean> {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn("Gmail credentials not configured. Skipping email send.");
      console.log("Would have sent invitation to:", params.toEmail);
      console.log("Temporary password:", params.tempPassword);
      return false;
    }

    try {
      const transporter = this.createTransporter();
      const departmentList = params.departments.map(d =>
        d.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      ).join(', ');

      const loginUrl = 'https://1strep.com';

      const mailOptions = {
        from: `"1stRep" <${process.env.GMAIL_USER}>`,
        to: params.toEmail,
        subject: "Welcome to 1stRep Admin Team",
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to 1stRep Admin Team</title>
</head>
<body style="margin:0;padding:0;background-color:#080808;font-family:${FONT};-webkit-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#080808;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background-color:#0F0F0F;border:1px solid #3A3A3A;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#080808;padding:28px 40px;text-align:center;border-bottom:2px solid #FAFAF8;">
              <img src="https://1strep.com/1strep-header-logo.png" alt="1stRep"
                width="130" style="display:inline-block;max-width:130px;height:auto;" />
              <p style="margin:10px 0 0;font-size:10px;letter-spacing:4px;text-transform:uppercase;
                color:#6E6E6E;font-family:${FONT};">Admin Team</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 20px;font-size:24px;font-weight:900;color:#FAFAF8;
                font-family:${FONT};letter-spacing:-0.5px;">Welcome to the 1stRep Admin Team</h2>
              <p style="color:#B0B0B0;line-height:1.7;margin:0 0 20px;font-family:${FONT};">
                Hello <strong style="color:#FAFAF8;">${params.toName}</strong>,
              </p>
              <p style="color:#B0B0B0;line-height:1.7;margin:0 0 28px;font-family:${FONT};">
                You have been invited to join the 1stRep Admin Team. Your account is ready
                and you now have access to the admin dashboard.
              </p>

              <!-- Credentials card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background-color:#161616;border:1px solid #3A3A3A;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 16px;font-size:9px;font-weight:700;letter-spacing:3px;
                      text-transform:uppercase;color:#6E6E6E;font-family:${FONT};">Your Login Credentials</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom:14px;border-bottom:1px solid #3A3A3A;">
                          <p style="margin:0 0 4px;font-size:11px;color:#6E6E6E;font-family:${FONT};">Email</p>
                          <p style="margin:0;font-size:14px;font-weight:700;color:#FAFAF8;
                            font-family:monospace,${FONT};">${params.toEmail}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:14px;padding-bottom:14px;border-bottom:1px solid #3A3A3A;">
                          <p style="margin:0 0 4px;font-size:11px;color:#6E6E6E;font-family:${FONT};">Temporary Password</p>
                          <p style="margin:0;font-size:14px;font-weight:700;color:#FAFAF8;
                            font-family:monospace,${FONT};">${params.tempPassword}</p>
                        </td>
                      </tr>
                      ${params.jobTitle ? `
                      <tr>
                        <td style="padding-top:14px;padding-bottom:14px;border-bottom:1px solid #3A3A3A;">
                          <p style="margin:0 0 4px;font-size:11px;color:#6E6E6E;font-family:${FONT};">Job Title</p>
                          <p style="margin:0;font-size:14px;font-weight:700;color:#FAFAF8;font-family:${FONT};">${params.jobTitle}</p>
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding-top:14px;">
                          <p style="margin:0 0 4px;font-size:11px;color:#6E6E6E;font-family:${FONT};">Department Access</p>
                          <p style="margin:0;font-size:14px;font-weight:700;color:#FAFAF8;font-family:${FONT};">${departmentList}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:#FAFAF8;">
                    <a href="${loginUrl}/login"
                      style="display:inline-block;padding:14px 32px;color:#080808;text-decoration:none;
                        font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;
                        font-family:${FONT};">Log In to Admin Dashboard</a>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background-color:#161616;border:1px solid #3A3A3A;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:12px;color:#B0B0B0;line-height:1.6;font-family:${FONT};">
                      <strong style="color:#FAFAF8;">Security Notice:</strong>
                      Please change your password immediately after your first login.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color:#6E6E6E;line-height:1.7;margin:0;font-size:13px;font-family:${FONT};">
                If you have any questions, please contact your team administrator.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#080808;padding:24px 40px;text-align:center;border-top:1px solid #3A3A3A;">
              <img src="https://1strep.com/1strep-header-logo.png" alt="1stRep"
                width="80" style="display:inline-block;max-width:80px;height:auto;opacity:0.6;margin-bottom:10px;" />
              <p style="margin:0;font-size:10px;color:#3A3A3A;font-family:${FONT};">
                &copy; ${new Date().getFullYear()} 1stRep Ltd &nbsp;&bull;&nbsp; United Kingdom
              </p>
              <p style="margin:4px 0 0;font-size:10px;color:#3A3A3A;font-family:${FONT};">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim(),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Admin invitation email sent:", info.messageId);
      return true;
    } catch (error) {
      console.error("Failed to send admin invitation email:", error);
      return false;
    }
  }
}

export const emailService = new EmailService();
