import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private readonly mailer: NestMailerService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Build the shared email layout wrapper.
   * All emails use the same premium branded shell.
   */
  private buildEmailLayout(content: string): string {
    const year = new Date().getFullYear();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Kollabary</title>
  <!--[if mso]>
  <style>
    table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #faf9fb; font-family: Matter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9fb; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Inner card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 460px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(233, 30, 140, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02);">

          <!-- Header band -->
          <tr>
            <td style="padding: 32px 24px 20px 24px; text-align: center;">
              <!-- Logo PNG -->
              <img src="https://kollabary.s3.ap-south-1.amazonaws.com/email-template-logo.png" alt="Kollabary" width="140" style="display: inline-block; border: 0;">
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 24px 24px 24px;">
              ${content}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 24px;">
              <hr style="border: none; height: 1px; background: linear-gradient(to right, transparent, #f0ebf8, transparent); margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px 24px 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #8b7fa0; line-height: 1.5;">
                This email was sent by Kollabary. Please do not reply directly.
              </p>
              <p style="margin: 0; font-size: 11px; color: #a8a1b5;">
                &copy; ${year} Kollabary. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userId: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}&id=${userId}`;

    const content = `
      <!-- Icon -->
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 56px; height: 56px; background: #fff1f8; border-radius: 16px; line-height: 56px; text-align: center;">
          <span style="font-size: 28px;">🔒</span>
        </div>
      </div>

      <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 800; color: #1d284d; text-align: center; letter-spacing: -0.4px;">Reset Your Password</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #514b61; text-align: center; line-height: 1.6;">
        We received a request to reset your Kollabary password. Click the button below to create a new one.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="${resetLink}"
           target="_blank"
           style="display: inline-block; background: linear-gradient(90deg, #E91E8C 0%, #6B1B6F 100%); color: #ffffff; padding: 14px 36px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(233, 30, 140, 0.2); letter-spacing: 0.2px;">
          Reset Password
        </a>
      </div>

      <!-- Info box -->
      <div style="background: #faf9fb; border: 1px solid #f0ebf8; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #E91E8C;">⏱ Expires in 1 hour</p>
        <p style="margin: 0; font-size: 13px; color: #6b5f7b; line-height: 1.5;">
          For security, this link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>

      <!-- Fallback link -->
      <p style="margin: 0; font-size: 11px; color: #a8a1b5; text-align: center; line-height: 1.6;">
        If the button doesn't work, copy and paste this link:<br>
        <a href="${resetLink}" style="color: #6B1B6F; word-break: break-all; font-size: 10px;">${resetLink}</a>
      </p>`;

    try {
      await this.mailer.sendMail({
        to: email,
        subject: 'Reset Your Kollabary Password',
        html: this.buildEmailLayout(content),
      });
      this.logger.log(`Password reset email sent to ${email}`);
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
      <!-- Icon -->
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 56px; height: 56px; background: #fff1f8; border-radius: 16px; line-height: 56px; text-align: center;">
          <span style="font-size: 28px;">🤝</span>
        </div>
      </div>

      <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 800; color: #1d284d; text-align: center; letter-spacing: -0.4px;">New Collaboration Request</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #514b61; text-align: center; line-height: 1.6;">
        You've received a new proposal on Kollabary! Review the details below.
      </p>

      <!-- Details card -->
      <div style="background: #faf9fb; border: 1px solid #f0ebf8; border-radius: 16px; padding: 16px 20px; margin-bottom: 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 12px;">
              <p style="margin: 0; font-size: 10px; color: #a8a1b5; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">From</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; color: #1d284d;">${requesterName}</p>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin: 0; font-size: 10px; color: #a8a1b5; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Project</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; color: #E91E8C;">${collaborationTitle}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${dashboardLink}"
           target="_blank"
           style="display: inline-block; background: linear-gradient(90deg, #E91E8C 0%, #6B1B6F 100%); color: #ffffff; padding: 14px 36px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(233, 30, 140, 0.2); letter-spacing: 0.2px;">
          View Request
        </a>
      </div>`;

    try {
      await this.mailer.sendMail({
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
    const emoji = isApproved ? '✅' : '⚠️';
    const statusColor = isApproved ? '#16a34a' : '#ea580c';
    const statusBg = isApproved ? '#f0fdf4' : '#fff7ed';
    const statusBorder = isApproved ? '#bbf7d0' : '#fed7aa';
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const content = `
      <!-- Icon -->
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 56px; height: 56px; background: #fff1f8; border-radius: 16px; line-height: 56px; text-align: center;">
          <span style="font-size: 28px;">🛡️</span>
        </div>
      </div>

      <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 800; color: #1d284d; text-align: center; letter-spacing: -0.4px;">Verification Update</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #514b61; text-align: center; line-height: 1.6;">
        Your profile verification request has been reviewed by our team.
      </p>

      <!-- Status badge -->
      <div style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 16px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 6px 0; font-size: 24px;">${emoji}</p>
        <p style="margin: 0; font-size: 18px; font-weight: 800; color: ${statusColor}; letter-spacing: -0.3px;">${statusLabel}</p>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #514b61; line-height: 1.5;">
          ${isApproved
        ? 'Great news! Your profile is now verified. The verified badge is now live on your profile.'
        : 'Unfortunately, your request was not approved this time. Review the feedback in your settings and try again.'}
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${settingsLink}"
           target="_blank"
           style="display: inline-block; background: linear-gradient(90deg, #E91E8C 0%, #6B1B6F 100%); color: #ffffff; padding: 14px 36px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(233, 30, 140, 0.2); letter-spacing: 0.2px;">
          ${isApproved ? 'View Profile' : 'Go to Settings'}
        </a>
      </div>`;

    try {
      await this.mailer.sendMail({
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
      <!-- Icon -->
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 56px; height: 56px; background: #fff1f8; border-radius: 16px; line-height: 56px; text-align: center;">
          <span style="font-size: 28px;">🛡️</span>
        </div>
      </div>

      <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 800; color: #1d284d; text-align: center; letter-spacing: -0.4px;">Verify Your Email</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #514b61; text-align: center; line-height: 1.6;">
        Welcome to Kollabary! Use the code below to complete your registration.
      </p>

      <!-- OTP Box -->
      <div style="text-align: center; margin: 0 0 24px 0;">
        <div style="display: inline-block; background: #faf9fb; border: 2px dashed #E91E8C; border-radius: 16px; padding: 16px 32px;">
          <span style="font-size: 32px; font-weight: 800; color: #E91E8C; letter-spacing: 8px;">${otp}</span>
        </div>
      </div>

      <!-- Info box -->
      <div style="background: #faf9fb; border: 1px solid #f0ebf8; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #E91E8C;">⏱ Expires in 10 minutes</p>
        <p style="margin: 0; font-size: 13px; color: #6b5f7b; line-height: 1.5;">
          For security, this code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>`;

    try {
      await this.mailer.sendMail({
        to: email,
        subject: 'Verify Your Kollabary Account',
        html: this.buildEmailLayout(content),
      });
      this.logger.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      return false;
    }
  }

  async sendPaymentSuccessEmail(email: string, name: string, amount: number, coins: number, orderId: string): Promise<boolean> {
    const content = `
      <!-- Icon -->
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 56px; height: 56px; background: #f0fdf4; border-radius: 16px; line-height: 56px; text-align: center;">
          <span style="font-size: 28px;">💰</span>
        </div>
      </div>

      <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 800; color: #1d284d; text-align: center; letter-spacing: -0.4px;">Payment Successful!</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #514b61; text-align: center; line-height: 1.6;">
        Your top-up was successful. KC coins have been added to your wallet.
      </p>

      <!-- Details card -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 12px;">
              <p style="margin: 0; font-size: 10px; color: #16a34a; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #1d284d;">₹${amount}</p>
            </td>
            <td style="padding-bottom: 12px; text-align: right;">
              <p style="margin: 0; font-size: 10px; color: #16a34a; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">K Coins Added</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #E91E8C;">${coins} KC</p>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 12px; border-top: 1px dashed #bbf7d0;">
              <p style="margin: 0; font-size: 10px; color: #16a34a; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Order ID</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #514b61;">${orderId}</p>
            </td>
          </tr>
        </table>
      </div>

      <p style="margin: 0; font-size: 13px; color: #6b5f7b; text-align: center; line-height: 1.5;">
        Thank you for choosing Kollabary! You can now use your KC coins for auctions and collaborations.
      </p>`;

    try {
      await this.mailer.sendMail({
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
}


