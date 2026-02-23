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
<body style="margin: 0; padding: 0; background-color: #f5f3ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f3ff; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Inner card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(124, 58, 237, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);">

          <!-- Header band -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%); padding: 36px 32px 28px 32px; text-align: center;">
              <!-- Logo text -->
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Kollabary</h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.75); font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Collaboration Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 32px 32px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; height: 1px; background: linear-gradient(to right, transparent, #e9e5f5, transparent); margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #a8a1b5; line-height: 1.5;">
                This email was sent by Kollabary. Please do not reply directly.
              </p>
              <p style="margin: 0; font-size: 12px; color: #c4bdd4;">
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

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    const content = `
      <!-- Icon -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #ede9fe, #f5f3ff); border-radius: 16px; line-height: 56px; text-align: center;">
          <span style="font-size: 28px;">🔒</span>
        </div>
      </div>

      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #1e1335; text-align: center; letter-spacing: -0.3px;">Reset Your Password</h2>
      <p style="margin: 0 0 28px 0; font-size: 15px; color: #6b5f7b; text-align: center; line-height: 1.6;">
        We received a request to reset the password for your Kollabary account. Click the button below to create a new password.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 0 0 28px 0;">
        <a href="${resetLink}"
           target="_blank"
           style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: #ffffff; padding: 14px 40px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 14px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25); letter-spacing: 0.2px;">
          Reset Password
        </a>
      </div>

      <!-- Info box -->
      <div style="background: #faf8ff; border: 1px solid #ede9fe; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #7c3aed;">⏱ Expires in 1 hour</p>
        <p style="margin: 0; font-size: 13px; color: #8b7fa0; line-height: 1.5;">
          For security, this link will expire after 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>

      <!-- Fallback link -->
      <p style="margin: 0; font-size: 12px; color: #a8a1b5; text-align: center; line-height: 1.6;">
        If the button doesn't work, copy and paste this link:<br>
        <a href="${resetLink}" style="color: #7c3aed; word-break: break-all; font-size: 11px;">${resetLink}</a>
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
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #ede9fe, #f5f3ff); border-radius: 16px; line-height: 56px; text-align: center;">
          <span style="font-size: 28px;">🤝</span>
        </div>
      </div>

      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #1e1335; text-align: center; letter-spacing: -0.3px;">New Collaboration Request</h2>
      <p style="margin: 0 0 28px 0; font-size: 15px; color: #6b5f7b; text-align: center; line-height: 1.6;">
        You've received a new collaboration request on Kollabary!
      </p>

      <!-- Details card -->
      <div style="background: #faf8ff; border: 1px solid #ede9fe; border-radius: 16px; padding: 24px; margin-bottom: 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 12px;">
              <p style="margin: 0; font-size: 12px; color: #a8a1b5; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">From</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: #1e1335;">${requesterName}</p>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin: 0; font-size: 12px; color: #a8a1b5; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Project</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: #7c3aed;">${collaborationTitle}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${dashboardLink}"
           target="_blank"
           style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: #ffffff; padding: 14px 40px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 14px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25); letter-spacing: 0.2px;">
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
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; background: linear-gradient(135deg, #ede9fe, #f5f3ff); border-radius: 16px; line-height: 56px; text-align: center;">
          <span style="font-size: 28px;">🛡️</span>
        </div>
      </div>

      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #1e1335; text-align: center; letter-spacing: -0.3px;">Verification Update</h2>
      <p style="margin: 0 0 28px 0; font-size: 15px; color: #6b5f7b; text-align: center; line-height: 1.6;">
        Your profile verification request has been reviewed.
      </p>

      <!-- Status badge -->
      <div style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 16px; padding: 20px 24px; margin-bottom: 28px; text-align: center;">
        <p style="margin: 0 0 4px 0; font-size: 24px;">${emoji}</p>
        <p style="margin: 0; font-size: 18px; font-weight: 800; color: ${statusColor}; letter-spacing: -0.2px;">${statusLabel}</p>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #6b5f7b; line-height: 1.5;">
          ${isApproved
        ? 'Congratulations! Your profile is now verified. A verified badge will appear on your profile.'
        : 'Unfortunately, your request was not approved this time. You can review the feedback and submit a new request from your settings.'}
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${settingsLink}"
           target="_blank"
           style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: #ffffff; padding: 14px 40px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 14px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25); letter-spacing: 0.2px;">
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
}

