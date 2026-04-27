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
  <style>
    @media only screen and (max-width: 600px) {
      .inner-container { width: 100% !important; border-radius: 0 !important; border: none !important; }
      .content-padding { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Inner card -->
        <table role="presentation" class="inner-container" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px 40px; text-align: center;">
              <img src="https://kollabary.s3.ap-south-1.amazonaws.com/email-template-logo.png" alt="Kollabary" width="130" style="display: inline-block; border: 0;">
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td class="content-padding" style="padding: 0 40px 40px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #fcfdfe; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                This is an automated message from Kollabary. If you have questions, please visit our support center.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                &copy; ${year} Kollabary. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

        <!-- Unsubscribe/Legal -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin-top: 24px;">
           <tr>
            <td style="text-align: center; padding: 0 16px;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                You are receiving this because you registered on kollabary.com. 
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
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1e293b; text-align: center; letter-spacing: -0.02em;">Reset your password</h1>
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #475569; text-align: center; line-height: 1.6;">
        We received a request to reset your password. Click the button below to proceed.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 0 0 32px 0;">
        <a href="${resetLink}"
           target="_blank"
           style="display: inline-block; background-color: #E91E8C; color: #ffffff; padding: 14px 32px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(233, 30, 140, 0.15);">
          Reset Password
        </a>
      </div>

      <!-- Info box -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #E91E8C;">Link expires in 1 hour</p>
        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <!-- Fallback link -->
      <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
        Button not working? Copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color: #6B1B6F; word-break: break-all;">${resetLink}</a>
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
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1e293b; text-align: center; letter-spacing: -0.02em;">New Collaboration Proposal</h1>
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #475569; text-align: center; line-height: 1.6;">
        You've received a new collaboration request. Review the details below to respond.
      </p>

      <!-- Details card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 20px;">
              <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">From</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1e293b;">${requesterName}</p>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Project Title</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #E91E8C;">${collaborationTitle}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${dashboardLink}"
           target="_blank"
           style="display: inline-block; background-color: #E91E8C; color: #ffffff; padding: 14px 36px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(233, 30, 140, 0.15);">
          Review Proposal
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
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1e293b; text-align: center; letter-spacing: -0.02em;">Verification Update</h1>
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #475569; text-align: center; line-height: 1.6;">
        The review of your profile verification request is complete.
      </p>

      <!-- Status badge -->
      <div style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: center;">
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.05em;">${statusLabel}</p>
        <div style="margin-top: 16px; font-size: 15px; color: #475569; line-height: 1.6;">
          ${isApproved
        ? 'Great news! Your profile is now verified. The verified badge is now live on your profile.'
        : 'Unfortunately, your request was not approved this time. Please review the feedback in your settings and feel free to try again.'}
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${settingsLink}"
           target="_blank"
           style="display: inline-block; background-color: #E91E8C; color: #ffffff; padding: 14px 36px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(233, 30, 140, 0.15);">
          ${isApproved ? 'View Profile' : 'Check Feedback'}
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
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1e293b; text-align: center; letter-spacing: -0.02em;">Verify your email</h1>
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #475569; text-align: center; line-height: 1.6;">
        Thanks for joining Kollabary! Please use the verification code below to complete your sign up.
      </p>

      <!-- OTP Box -->
      <div style="text-align: center; margin: 0 0 32px 0;">
        <div style="display: inline-block; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px 48px;">
          <span style="font-size: 32px; font-weight: 700; color: #E91E8C; letter-spacing: 0.2em;">${otp}</span>
        </div>
      </div>

      <!-- Info box -->
      <div style="background-color: #fffaf0; border: 1px solid #feebc8; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #c05621;">Code expires in 10 minutes</p>
        <p style="margin: 0; font-size: 14px; color: #7b341e; line-height: 1.5;">
          For security reasons, this code will expire soon. If you didn't request this, please ignore this email.
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
      <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1e293b; text-align: center; letter-spacing: -0.02em;">Payment successful</h1>
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #475569; text-align: center; line-height: 1.6;">
        Your wallet has been credited. You can now use your coins for auctions and collaborations.
      </p>

      <!-- Details card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 16px;">
              <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Amount Paid</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #1e293b;">₹${amount}</p>
            </td>
            <td style="padding-bottom: 16px; text-align: right;">
              <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">K Coins Added</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #E91E8C;">${coins} K</p>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 16px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Transaction ID</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 500; color: #1e293b; font-family: monospace;">${orderId}</p>
            </td>
          </tr>
        </table>
      </div>

      <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center; line-height: 1.6;">
        Thank you for your purchase! A receipt has been attached to your account history.
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


