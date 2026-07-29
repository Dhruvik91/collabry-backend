import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    this.resend = new Resend(apiKey);
  }

  /**
   * Sends an email using Resend
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
        "RESEND_FROM_EMAIL",
        "support@kollabary.com",
      );

    try {
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(
        `Email sent successfully to ${options.to} via Resend. ID: ${data?.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to} via Resend`,
        error,
      );
      throw error;
    }
  }
}
