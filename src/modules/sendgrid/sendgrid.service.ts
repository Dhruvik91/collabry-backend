import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import sgMail from "@sendgrid/mail";

@Injectable()
export class SendgridService {
  private readonly logger = new Logger(SendgridService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("SENDGRID_API_KEY");
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn(
        "SENDGRID_API_KEY is not defined. SendGrid services will fail.",
      );
    }
  }

  /**
   * Sends an email using SendGrid
   * @param options Mail options
   */
  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }) {
    const fromEmail =
      options.from ||
      this.configService.get<string>(
        "SENDGRID_FROM_EMAIL",
        "noreply@kollabary.com",
      );

    try {
      const msg = {
        to: options.to,
        from: fromEmail,
        subject: options.subject,
        html: options.html,
      };

      await sgMail.send(msg);
      this.logger.log(`Email sent successfully to ${options.to} via SendGrid`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to} via SendGrid`,
        error,
      );
      if (error.response && error.response.body) {
        this.logger.error(
          "SendGrid Error Body:",
          JSON.stringify(error.response.body, null, 2),
        );
      }
      throw error;
    }
  }
}
