import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { SendgridService } from '../sendgrid/sendgrid.service';


@Injectable()
export class AppMailerService {
  private readonly logger = new Logger(AppMailerService.name);

  constructor(
    private readonly mailer: NestMailerService,
    private readonly configService: ConfigService,
    private readonly sendgridService: SendgridService,
  ) { }

  /**
   * Dispatches mail through SendGrid if configured, otherwise falls back to defaults.
   */
  private async dispatchMail(options: { to: string; subject: string; html: string }): Promise<void> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      await this.sendgridService.sendMail(options);
    } else {
      await this.mailer.sendMail(options);
    }
  }

  /**
   * Build the shared email layout wrapper.
   * All emails use the same professional branded shell with dark/light mode support.
   */
  private buildEmailLayout(content: string): string {
    const year = new Date().getFullYear();
    const logoLight = 'https://kollabary.s3.ap-south-1.amazonaws.com/email-template-logo.png';
    const logoDark = 'https://kollabary.s3.ap-south-1.amazonaws.com/email_template_dark_mode_logo.png';

    return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Kollabary</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      body, .wrapper { background-color: #0f172a !important; color: #f1f5f9 !important; }
      .container { background-color: #1e293b !important; border-color: #334155 !important; }
      .text-main { color: #f1f5f9 !important; }
      .text-sub { color: #94a3b8 !important; }
      .card-sub { background-color: #334155 !important; border-color: #475569 !important; }
      .footer { border-top-color: #334155 !important; background-color: #1e293b !important; }
      .logo-light { display: none !important; }
      .logo-dark { display: block !important; }
    }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; border: none !important; }
      .content-padding { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div class="wrapper" style="background-color: #f8fafc;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" class="container" width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <!-- Header -->
            <tr>
              <td style="padding: 32px 32px 24px 32px; text-align: center;">
                <!--[if !mso]><!-->
                <div class="logo-dark" style="display:none; mso-hide:all;">
                  <img src="${logoDark}" alt="Kollabary" width="120" style="display: inline-block; border: 0;">
                </div>
                <!--<![endif]-->
                <div class="logo-light">
                  <img src="${logoLight}" alt="Kollabary" width="120" style="display: inline-block; border: 0;">
                </div>
              </td>
            </tr>

            <!-- Content Body -->
            <tr>
              <td class="content-padding" style="padding: 0 32px 32px 32px;">
                ${content}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="footer" style="padding: 24px 32px; background-color: #fcfdfe; border-top: 1px solid #f1f5f9; text-align: center;">
                <p class="text-sub" style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                  This is an automated message from Kollabary.
                </p>
                <p class="text-sub" style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;">
                  &copy; ${year} Kollabary. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userId: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}&id=${userId}`;

    const content = `
      <h1 class="text-main" style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1e293b; text-align: center; letter-spacing: -0.02em;">Reset your password</h1>
      <p class="text-sub" style="margin: 0 0 24px 0; font-size: 15px; color: #475569; text-align: center; line-height: 1.5;">
        We received a request to reset your password. Click the button below to proceed.
      </p>

      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="${resetLink}"
           target="_blank"
           style="display: inline-block; background-color: #E91E8C; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(233, 30, 140, 0.2);">
          Reset Password
        </a>
      </div>

      <div class="card-sub" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #E91E8C;">Link expires in 1 hour</p>
        <p class="text-sub" style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.4;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>

      <p class="text-sub" style="margin: 0; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
        Button not working? <a href="${resetLink}" style="color: #E91E8C; word-break: break-all;">Click here</a>
      </p>`;

    try {
      await this.dispatchMail({
        to: email,
        subject: 'Reset Your Kollabary Password',
        html: this.buildEmailLayout(content),
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      return false;
    }
  }

  async sendCollaborationRequestEmail(email: string, requesterName: string, collaborationTitle: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const dashboardLink = `${frontendUrl}/collaborations`;

    const content = `
      <h1 class="text-main" style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1e293b; text-align: center; letter-spacing: -0.02em;">New Collaboration Proposal</h1>
      <p class="text-sub" style="margin: 0 0 24px 0; font-size: 15px; color: #475569; text-align: center; line-height: 1.5;">
        You've received a new collaboration request.
      </p>

      <div class="card-sub" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 16px;">
              <p class="text-sub" style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">From</p>
              <p class="text-main" style="margin: 2px 0 0 0; font-size: 15px; font-weight: 600; color: #1e293b;">${requesterName}</p>
            </td>
          </tr>
          <tr>
            <td>
              <p class="text-sub" style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Project Title</p>
              <p style="margin: 2px 0 0 0; font-size: 15px; font-weight: 600; color: #E91E8C;">${collaborationTitle}</p>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center;">
        <a href="${dashboardLink}"
           target="_blank"
           style="display: inline-block; background-color: #E91E8C; color: #ffffff; padding: 12px 32px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">
          Review Proposal
        </a>
      </div>`;

    try {
      await this.dispatchMail({
        to: email,
        subject: `New Collaboration Request: ${collaborationTitle}`,
        html: this.buildEmailLayout(content),
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send collaboration email to ${email}`, error);
      return false;
    }
  }

  async sendVerificationUpdateEmail(email: string, status: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const settingsLink = `${frontendUrl}/settings`;

    const isApproved = status.toLowerCase() === 'approved';
    const statusColor = isApproved ? '#16a34a' : '#ea580c';
    const statusBg = isApproved ? '#f0fdf4' : '#fff7ed';
    const statusBorder = isApproved ? '#bbf7d0' : '#fed7aa';
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const content = `
      <h1 class="text-main" style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1e293b; text-align: center; letter-spacing: -0.02em;">Verification Update</h1>
      <p class="text-sub" style="margin: 0 0 24px 0; font-size: 15px; color: #475569; text-align: center; line-height: 1.5;">
        Your profile verification request update.
      </p>

      <div style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0; font-size: 16px; font-weight: 700; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.05em;">${statusLabel}</p>
        <div class="text-sub" style="margin-top: 12px; font-size: 14px; color: #475569; line-height: 1.5;">
          ${isApproved
        ? 'Your profile is now verified. The badge is now live!'
        : 'Your request was not approved. Please check feedback in settings.'}
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${settingsLink}"
           target="_blank"
           style="display: inline-block; background-color: #E91E8C; color: #ffffff; padding: 12px 32px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">
          ${isApproved ? 'View Profile' : 'Check Feedback'}
        </a>
      </div>`;

    try {
      await this.dispatchMail({
        to: email,
        subject: `Verification Request Update: ${statusLabel}`,
        html: this.buildEmailLayout(content),
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, otp: string): Promise<boolean> {
    const content = `
      <h1 class="text-main" style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1e293b; text-align: center; letter-spacing: -0.02em;">Verify your email</h1>
      <p class="text-sub" style="margin: 0 0 24px 0; font-size: 15px; color: #475569; text-align: center; line-height: 1.5;">
        Please use the verification code below to complete your sign up.
      </p>

      <div style="text-align: center; margin: 0 0 24px 0;">
        <div class="card-sub" style="display: inline-block; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 32px;">
          <span style="font-size: 28px; font-weight: 700; color: #E91E8C; letter-spacing: 0.2em;">${otp}</span>
        </div>
      </div>

      <div class="card-sub" style="background-color: #fffaf0; border: 1px solid #feebc8; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #c05621;">Expires in 10 minutes</p>
        <p class="text-sub" style="margin: 0; font-size: 13px; color: #7b341e; line-height: 1.4;">
          If you didn't request this, please ignore this email.
        </p>
      </div>`;

    try {
      await this.dispatchMail({
        to: email,
        subject: 'Verify Your Kollabary Account',
        html: this.buildEmailLayout(content),
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      return false;
    }
  }

  async sendPaymentSuccessEmail(email: string, name: string, amount: number, coins: number, orderId: string): Promise<boolean> {
    const coinUrl = 'https://kollabary.s3.ap-south-1.amazonaws.com/kollabary-coin.png';
    
    const content = `
      <div style="text-align: center; margin-bottom: 16px;">
        <img src="${coinUrl}" alt="K-Coin" width="48" style="display: inline-block;">
      </div>
      <h1 class="text-main" style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1e293b; text-align: center; letter-spacing: -0.02em;">Payment Successful</h1>
      <p class="text-sub" style="margin: 0 0 24px 0; font-size: 15px; color: #475569; text-align: center; line-height: 1.5;">
        Your wallet has been credited successfully.
      </p>

      <div class="card-sub" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 12px;">
              <p class="text-sub" style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Amount Paid</p>
              <p class="text-main" style="margin: 2px 0 0 0; font-size: 16px; font-weight: 700; color: #1e293b;">₹${amount}</p>
            </td>
            <td style="padding-bottom: 12px; text-align: right;">
              <p class="text-sub" style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">K Coins Added</p>
              <p style="margin: 2px 0 0 0; font-size: 16px; font-weight: 700; color: #E91E8C;">${coins} K</p>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 12px; border-top: 1px solid #e2e8f0;">
              <p class="text-sub" style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Transaction ID</p>
              <p class="text-main" style="margin: 2px 0 0 0; font-size: 13px; font-weight: 500; color: #1e293b; font-family: monospace;">${orderId}</p>
            </td>
          </tr>
        </table>
      </div>

      <p class="text-sub" style="margin: 0; font-size: 13px; color: #64748b; text-align: center; line-height: 1.5;">
        Thank you for your purchase!
      </p>`;

    try {
      await this.dispatchMail({
        to: email,
        subject: 'Top-up Successful - Kollabary',
        html: this.buildEmailLayout(content),
      });
      this.logger.log(`Payment success email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send payment success email to ${email}`, error);
      return false;
    }
  }

  async sendBidAcceptedEmail(email: string, auctionTitle: string, amount: number, brandName: string): Promise<boolean> {
    const coinUrl = 'https://kollabary.s3.ap-south-1.amazonaws.com/kollabary-coin.png';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const collaborationsLink = `${frontendUrl}/collaborations`;

    const content = `
      <div style="text-align: center; margin-bottom: 16px;">
        <img src="${coinUrl}" alt="K-Coin" width="48" style="display: inline-block;">
      </div>
      <h1 class="text-main" style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1e293b; text-align: center; letter-spacing: -0.02em;">Bid Accepted!</h1>
      <p class="text-sub" style="margin: 0 0 24px 0; font-size: 15px; color: #475569; text-align: center; line-height: 1.5;">
        Great news! Your bid for the auction <strong>${auctionTitle}</strong> has been accepted by <strong>${brandName}</strong>.
      </p>

      <div class="card-sub" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 12px;">
              <p class="text-sub" style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Brand</p>
              <p class="text-main" style="margin: 2px 0 0 0; font-size: 15px; font-weight: 600; color: #1e293b;">${brandName}</p>
            </td>
            <td style="padding-bottom: 12px; text-align: right;">
              <p class="text-sub" style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Bid Amount</p>
              <p style="margin: 2px 0 0 0; font-size: 16px; font-weight: 700; color: #E91E8C;">${amount} K</p>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 12px; border-top: 1px solid #e2e8f0;">
              <p class="text-sub" style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Auction Title</p>
              <p class="text-main" style="margin: 2px 0 0 0; font-size: 14px; font-weight: 500; color: #1e293b;">${auctionTitle}</p>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${collaborationsLink}"
           target="_blank"
           style="display: inline-block; background-color: #E91E8C; color: #ffffff; padding: 12px 32px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">
          View Collaboration
        </a>
      </div>

      <p class="text-sub" style="margin: 0; font-size: 13px; color: #64748b; text-align: center; line-height: 1.5;">
        A new collaboration has been created. You can now start working on the project!
      </p>`;

    try {
      await this.dispatchMail({
        to: email,
        subject: 'Bid Accepted - Kollabary Auction',
        html: this.buildEmailLayout(content),
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send bid accepted email to ${email}`, error);
      return false;
    }
  }
}
