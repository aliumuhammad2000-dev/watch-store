import { EmailSender, SendEmailParams } from "./email-sender.interface.js";

export class MockEmailSender implements EmailSender {
  public sentEmails: SendEmailParams[] = [];

  async sendEmail(params: SendEmailParams): Promise<{ messageId: string }> {
    const messageId = `mock_email_${Date.now()}`;
    this.sentEmails.push(params);

    console.log(`\n📧 [MOCK EMAIL SENT]`);
    console.log(`   To: ${params.to}`);
    console.log(`   Subject: ${params.subject}`);
    console.log(`   Message ID: ${messageId}\n`);

    return { messageId };
  }
}
