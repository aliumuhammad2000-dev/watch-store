import { Resend } from "resend";
import { EmailSender, SendEmailParams } from "./email-sender.interface.js";

export class ResendEmailSender implements EmailSender {
  private client: Resend;

  constructor(
    apiKey: string,
    private fromAddress: string = "orders@hourlane.com"
  ) {
    this.client = new Resend(apiKey);
  }

  async sendEmail(params: SendEmailParams): Promise<{ messageId: string }> {
    const { data, error } = await this.client.emails.send({
      from: this.fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error || !data) {
      throw new Error(`Resend email failed: ${error?.message || "Unknown error"}`);
    }

    return { messageId: data.id };
  }
}
