export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSender {
  sendEmail(params: SendEmailParams): Promise<{ messageId: string }>;
}
