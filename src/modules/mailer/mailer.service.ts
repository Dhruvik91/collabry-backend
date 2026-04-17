import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

const BRAND_LOGO_SVG = `
<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 225 225" width="64" height="64">
    <g>
        <path fill="#fdaa64" d="m113.91 10.07c3.13 1.39 6.07 3.04 9.03 4.74 1.04 0.6 1.04 0.6 2.1 1.2q2.28 1.3 4.55 2.61 3.69 2.12 7.39 4.22 5.31 3.03 10.61 6.07 5.25 3 10.5 6 11.46 6.52 22.87 13.11c0.89 0.51 0.89 0.51 1.79 1.03q4.36 2.52 8.72 5.05 1.57 0.91 3.19 1.85 1.4 0.8 2.83 1.64c2.14 1.2 4.32 2.31 6.51 3.41 0 10.23 0 20.46 0 31-4.27-1.42-7.14-2.49-10.85-4.7q-1.37-0.81-2.79-1.64c-1.48-0.88-1.48-0.88-2.98-1.78q-3.22-1.91-6.45-3.81-1.68-0.99-3.41-2.01c-5.39-3.17-10.83-6.25-16.27-9.34-7.88-4.48-15.75-8.96-23.5-13.66q-3.37-2.03-6.75-4.06-1.02-0.62-2.08-1.26-3.26-1.95-6.54-3.87-1-0.6-2.02-1.22c-3.63-2.13-3.63-2.13-7.72-2.43-3.05 0.9-5.53 2.18-8.3 3.74-1.64 0.91-1.64 0.91-3.31 1.85q-1.77 1-3.53 2-1.84 1.03-3.67 2.07-5.42 3.05-10.83 6.12-1.41 0.8-2.87 1.63-7.62 4.33-15.22 8.7-5.04 2.89-10.08 5.76-2.83 1.61-5.66 3.23-1.83 1.04-3.65 2.08c-6.6 3.75-13.16 7.55-19.61 11.56-1.91 1.04-1.91 1.04-3.91 1.04 0-10.23 0-20.46 0-31 3.63-2.02 7.26-4.04 11-6.13q13.02-7.26 25.88-14.81c9.81-5.77 19.73-11.35 29.71-16.84 4.73-2.61 9.45-5.21 14.09-7.98 0.98-0.58 0.98-0.58 1.98-1.17q2.42-1.46 4.84-2.94c2.5-1.13 2.5-1.13 4.41-1.06z" />
        <path fill="#1d284d" d="m48 101c0 16.83 0 33.66 0 51q2.46 0.99 5 2 1.8 0.92 3.57 1.92 0.97 0.55 1.97 1.11 1 0.57 2.02 1.16 0.96 0.54 1.94 1.09c6.2 3.52 12.34 7.13 18.5 10.72 0-14.85 0-29.7 0-45 3.73-2.14 7.47-4.29 11.31-6.5 1.76-1.02 1.76-1.02 3.56-2.06q1.38-0.78 2.81-1.6c1.42-0.81 1.42-0.81 2.87-1.65 2.45-1.19 2.45-1.19 5.45-1.19 0 33.66 0 67.32 0 102-4-0.8-5.78-1.21-9.05-3.15q-1.12-0.66-2.28-1.34-1.19-0.71-2.42-1.45c-1.27-0.75-1.27-0.75-2.57-1.51q-3.84-2.27-7.68-4.55-2-1.18-4.01-2.36-4-2.35-8.01-4.71-5.97-3.52-11.96-7.02-1.91-1.11-3.81-2.23-2.83-1.65-5.66-3.31-0.88-0.51-1.78-1.04c-0.89-0.52-0.89-0.52-1.79-1.04q-1.77-1.05-3.53-2.13c-3.14-1.92-6.17-3.49-9.63-4.77-4.31-1.77-8.06-3.51-10.82-7.39-2.42-7.22-2.07-14.94-1.85-22.46 0.1-3.6 0.05-7.19-0.02-10.79-0.01-16.04-0.01-16.04 3.15-20.59 3.43-3.19 7.34-4.6 11.72-6.16q2.86-1.71 5.63-3.56c4-2.56 4-2.56 7.37-1.44z" />
        <path fill="#1d284d" d="m179 100c6.75 2.25 6.75 2.25 10.2 4.31q1.09 0.65 2.22 1.32 1.12 0.68 2.27 1.37 1.13 0.67 2.3 1.37c3.05 1.82 6.05 3.66 9.01 5.63 0.37 2.07 0.37 2.07 0.36 4.66q0 1.45 0.01 2.93c-0.02 1.58-0.02 1.58-0.04 3.18q0 1.61-0.01 3.26-0.01 3.42-0.04 6.84-0.04 5.23-0.05 10.46-0.01 3.31-0.03 6.63 0 1.56-0.01 3.17-0.01 1.45-0.03 2.95-0.01 1.28-0.02 2.59c-0.14 2.28-0.38 4.18-1.14 6.33-2.32 1.67-2.32 1.67-5.41 3.32q-1.68 0.91-3.42 1.86-1.83 0.97-3.67 1.94-2.8 1.52-5.59 3.04-1.86 1.01-3.72 2.01-7.34 3.98-14.5 8.27-2.01 1.19-4.01 2.38-0.93 0.55-1.88 1.12-4.22 2.47-8.49 4.87-6.51 3.7-12.93 7.54-1.48 0.88-3 1.79-2.96 1.77-5.92 3.56-1.35 0.81-2.75 1.64-1.21 0.73-2.46 1.48c-2.25 1.18-2.25 1.18-6.25 2.18 0-33.66 0-67.32 0-102 4.01 0.8 5.79 1.22 9.07 3.18q1.09 0.65 2.22 1.32 1.12 0.68 2.27 1.37c1.13 0.68 1.13 0.68 2.29 1.36 2.07 1.24 4.12 2.47 6.15 3.77q1.09 0.51 2.22 1.03c3.06 3.38 2.27 7.51 2.17 11.89q-0.01 1.45-0.02 2.94-0.04 4.67-0.12 9.33-0.03 3.16-0.05 6.32-0.07 7.74-0.2 15.49c1.04-0.6 1.04-0.6 2.09-1.22q4.74-2.77 9.47-5.53 1.62-0.95 3.29-1.92 3.17-1.85 6.33-3.69 2.55-1.48 5.09-2.99c4.51-2.65 4.51-2.65 6.73-2.65 0-17.16 0-34.32 0-52z" />
        <path fill="#f64598" d="m112 59c5.67 1.19 10.55 4.43 15.5 7.31 1.36 0.79 1.36 0.79 2.74 1.59q11.87 6.88 23.65 13.91c1.31 0.78 1.31 0.78 2.65 1.57 1.15 0.69 1.15 0.69 2.32 1.39 2 1.15 4.07 2.2 6.14 3.23 0 9.9 0 19.8 0 30-4.95-1.98-9.41-4.3-14.06-6.88q-1.3-0.71-2.64-1.45c-7.33-4.06-14.52-8.33-21.68-12.7q-3.3-2-6.62-3.97-1.6-0.97-3.26-1.97c-2.63-1.27-2.63-1.27-5.05-0.52q-1.33 0.73-2.69 1.49-0.95 0.5-1.93 1.01-3.55 1.9-7.07 3.86-1.29 0.72-2.63 1.46-11.25 6.25-22.39 12.7c-4.27 2.46-8.54 4.83-12.98 6.97-1-1-1-1-1.11-3.78q0-1.8 0.01-3.66 0.01-1.95 0.01-3.96 0.01-2.08 0.03-4.16 0.01-2.09 0.01-4.18 0.02-5.13 0.05-10.26 4.97-2.81 9.94-5.63c1.52-0.86 1.52-0.86 3.08-1.74q8.47-4.79 16.97-9.54 1.68-0.94 3.42-1.91 3.3-1.85 6.6-3.68 1.5-0.84 3.04-1.7 1.32-0.74 2.68-1.49c1.8-1.04 3.54-2.16 5.27-3.31z" />
        <path fill="#fc707c" d="m114 12c4.22 0.42 7.24 1.42 10.85 3.6q1.37 0.81 2.79 1.65 1.47 0.89 2.99 1.81 3.24 1.93 6.49 3.86 1.68 1 3.42 2.03c5.69 3.38 11.45 6.65 17.21 9.93q1.74 0.99 3.49 1.98 2.65 1.52 5.3 3.03 6.66 3.8 13.32 7.61 2.89 1.65 5.77 3.31 1.85 1.06 3.7 2.12 2.57 1.47 5.14 2.94 1.45 0.83 2.95 1.69c2.16 1.21 4.37 2.33 6.58 3.44 0 10.23 0 20.46 0 31-4.27-1.42-7.14-2.49-10.85-4.7q-1.37-0.81-2.79-1.64-1.47-0.88-2.99-1.78-3.21-1.91-6.44-3.81-1.68-0.99-3.41-2.01c-5.39-3.17-10.83-6.25-16.27-9.34-9.01-5.13-17.99-10.3-26.84-15.69q-3.86-2.3-7.79-4.46-1.1-0.61-2.24-1.24-2.13-1.17-4.28-2.33c-3.23-1.77-5.02-2.88-7.1-6-0.24-2.71-0.24-2.71-0.23-5.95q0-1.72 0.01-3.51 0.01-1.8 0.03-3.67 0-1.81 0-3.69c0.05-9.04 0.05-9.04 1.19-10.18z" />
        <path fill="#b84996" d="m114 61c4.39 0.42 7.48 1.56 11.24 3.81q1.46 0.86 2.96 1.75c1.54 0.93 1.54 0.93 3.11 1.88 1.59 0.94 1.59 0.94 3.21 1.9q3.22 1.91 6.43 3.84 5.29 3.16 10.61 6.28 2.13 1.26 4.26 2.52c3.02 1.79 6.04 3.45 9.18 5.02 0 9.9 0 19.8 0 30-4.95-1.98-9.41-4.3-14.06-6.88q-1.3-0.71-2.64-1.45c-7.33-4.06-14.52-8.33-21.68-12.7-3.34-2.03-6.61-3.97-10.13-5.69-2.49-1.28-2.49-1.28-3.49-3.28q-0.14-2.92-0.13-5.85 0-1.73-0.01-3.52 0.01-1.82 0.02-3.69-0.01-1.83-0.02-3.71 0.01-1.73 0.01-3.52 0-1.59 0-3.24c0.13-2.47 0.13-2.47 1.13-3.47z" />
        <path fill="#e44498" d="m112 59q1.97 0.99 4 2c-0.99 0.5-0.99 0.5-2 1 0 8.91 0 17.82 0 27q-0.99 0-2 0c0-8.91 0-17.82 0-27q-1.48-0.49-3-1 1.48-0.99 3-2z" />
        <path fill="#f9bc9b" d="m114.38 10.31q0.8 0.34 1.62 0.69c-3.75 3-3.75 3-6 3q-2.01-0.47-4-1c5.42-3.08 5.42-3.08 8.38-2.69z" />
        <path fill="#e76eb1" d="m112 59q1.97 0.99 4 2c-0.99 0.5-0.99 0.5-2 1-0.66 3.03-0.66 3.03-1 6q-0.49 0-1 0 0-2.95 0-6-1.48-0.49-3-1 1.48-0.99 3-2z" />
    </g>
</svg>
`;

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
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9fb; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Inner card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(233, 30, 140, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);">

          <!-- Header band -->
          <tr>
            <td style="background: linear-gradient(90deg, #E91E8C 0%, #6B1B6F 100%); padding: 36px 32px 32px 32px; text-align: center;">
              <!-- Logo SVG -->
              <div style="margin-bottom: 12px;">
                ${BRAND_LOGO_SVG}
              </div>
              <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.85); font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">Collaboration Platform</p>
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
              <hr style="border: none; height: 1px; background: linear-gradient(to right, transparent, #f0ebf8, transparent); margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #8b7fa0; line-height: 1.5;">
                This email was sent by Kollabary. Please do not reply directly.
              </p>
              <p style="margin: 0; font-size: 12px; color: #a8a1b5;">
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
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 64px; height: 64px; background: #fff1f8; border-radius: 20px; line-height: 64px; text-align: center;">
          <span style="font-size: 32px;">🔒</span>
        </div>
      </div>

      <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #1d284d; text-align: center; letter-spacing: -0.5px;">Reset Your Password</h2>
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #514b61; text-align: center; line-height: 1.6;">
        We received a request to reset the password for your Kollabary account. Click the button below to create a new password.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 0 0 32px 0;">
        <a href="${resetLink}"
           target="_blank"
           style="display: inline-block; background: linear-gradient(90deg, #E91E8C 0%, #6B1B6F 100%); color: #ffffff; padding: 16px 48px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 16px; box-shadow: 0 6px 18px rgba(233, 30, 140, 0.25); letter-spacing: 0.3px;">
          Reset Password
        </a>
      </div>

      <!-- Info box -->
      <div style="background: #faf9fb; border: 1px solid #f0ebf8; border-radius: 16px; padding: 20px; margin-bottom: 28px;">
        <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #E91E8C;">⏱ Expires in 1 hour</p>
        <p style="margin: 0; font-size: 14px; color: #6b5f7b; line-height: 1.5;">
          For security, this link will expire after 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>

      <!-- Fallback link -->
      <p style="margin: 0; font-size: 12px; color: #a8a1b5; text-align: center; line-height: 1.6;">
        If the button doesn't work, copy and paste this link:<br>
        <a href="${resetLink}" style="color: #6B1B6F; word-break: break-all; font-size: 11px;">${resetLink}</a>
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
        <div style="display: inline-block; width: 64px; height: 64px; background: #fff1f8; border-radius: 20px; line-height: 64px; text-align: center;">
          <span style="font-size: 32px;">🤝</span>
        </div>
      </div>

      <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #1d284d; text-align: center; letter-spacing: -0.5px;">New Collaboration Request</h2>
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #514b61; text-align: center; line-height: 1.6;">
        You've received a new collaboration request on Kollabary!
      </p>

      <!-- Details card -->
      <div style="background: #faf9fb; border: 1px solid #f0ebf8; border-radius: 20px; padding: 24px; margin-bottom: 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 16px;">
              <p style="margin: 0; font-size: 12px; color: #a8a1b5; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">From</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #1d284d;">${requesterName}</p>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin: 0; font-size: 12px; color: #a8a1b5; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Project</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; color: #E91E8C;">${collaborationTitle}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${dashboardLink}"
           target="_blank"
           style="display: inline-block; background: linear-gradient(90deg, #E91E8C 0%, #6B1B6F 100%); color: #ffffff; padding: 16px 48px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 16px; box-shadow: 0 6px 18px rgba(233, 30, 140, 0.25); letter-spacing: 0.3px;">
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
        <div style="display: inline-block; width: 64px; height: 64px; background: #fff1f8; border-radius: 20px; line-height: 64px; text-align: center;">
          <span style="font-size: 32px;">🛡️</span>
        </div>
      </div>

      <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #1d284d; text-align: center; letter-spacing: -0.5px;">Verification Update</h2>
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #514b61; text-align: center; line-height: 1.6;">
        Your profile verification request has been reviewed.
      </p>

      <!-- Status badge -->
      <div style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 20px; padding: 24px; margin-bottom: 32px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 28px;">${emoji}</p>
        <p style="margin: 0; font-size: 20px; font-weight: 800; color: ${statusColor}; letter-spacing: -0.3px;">${statusLabel}</p>
        <p style="margin: 12px 0 0 0; font-size: 14px; color: #514b61; line-height: 1.5;">
          ${isApproved
        ? 'Congratulations! Your profile is now verified. A verified badge will appear on your profile.'
        : 'Unfortunately, your request was not approved this time. You can review the feedback and submit a new request from your settings.'}
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${settingsLink}"
           target="_blank"
           style="display: inline-block; background: linear-gradient(90deg, #E91E8C 0%, #6B1B6F 100%); color: #ffffff; padding: 16px 48px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 16px; box-shadow: 0 6px 18px rgba(233, 30, 140, 0.25); letter-spacing: 0.3px;">
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
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 64px; height: 64px; background: #fff1f8; border-radius: 20px; line-height: 64px; text-align: center;">
          <span style="font-size: 32px;">🛡️</span>
        </div>
      </div>

      <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #1d284d; text-align: center; letter-spacing: -0.5px;">Verify Your Email</h2>
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #514b61; text-align: center; line-height: 1.6;">
        Welcome to Kollabary! Please use the verification code below to complete your registration.
      </p>

      <!-- OTP Box -->
      <div style="text-align: center; margin: 0 0 32px 0;">
        <div style="display: inline-block; background: #faf9fb; border: 2px dashed #E91E8C; border-radius: 20px; padding: 24px 48px;">
          <span style="font-size: 36px; font-weight: 800; color: #E91E8C; letter-spacing: 10px;">${otp}</span>
        </div>
      </div>

      <!-- Info box -->
      <div style="background: #faf9fb; border: 1px solid #f0ebf8; border-radius: 16px; padding: 20px; margin-bottom: 28px;">
        <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #E91E8C;">⏱ Expires in 10 minutes</p>
        <p style="margin: 0; font-size: 14px; color: #6b5f7b; line-height: 1.5;">
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
}


