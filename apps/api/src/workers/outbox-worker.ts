import { eq, and, sql, asc } from "@hourlane/db";
import { type Database, outboxMessages } from "@hourlane/db";
import { EmailSender } from "../adapters/email/email-sender.interface.js";
import {
  renderOrderConfirmedEmail,
  renderOrderStatusUpdatedEmail,
  type OrderConfirmedEmailData,
  type OrderStatusUpdatedEmailData,
} from "../modules/notifications/email-templates.js";

export class OutboxWorker {
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private db: Database,
    private emailSender: EmailSender,
    private webAppUrl: string
  ) {}

  async processBatch(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    let processedCount = 0;

    try {
      // 1. Fetch pending messages ready for dispatch
      const pendingJobs = await this.db
        .select()
        .from(outboxMessages)
        .where(
          and(
            eq(outboxMessages.status, "pending"),
            sql`${outboxMessages.nextRetryAt} <= NOW()`
          )
        )
        .orderBy(asc(outboxMessages.createdAt))
        .limit(10);

      for (const job of pendingJobs) {
        // Mark as processing
        await this.db
          .update(outboxMessages)
          .set({ status: "processing" })
          .where(eq(outboxMessages.id, job.id));

        try {
          // Process job based on event type
          if (job.eventType === "email.order_confirmed") {
            const payload = job.payload as unknown as OrderConfirmedEmailData;
            const email = renderOrderConfirmedEmail({
              ...payload,
              webAppUrl: this.webAppUrl,
            });

            await this.emailSender.sendEmail({
              to: payload.customerEmail,
              subject: email.subject,
              html: email.html,
              text: email.text,
            });
          } else if (job.eventType === "email.status_updated") {
            const payload = job.payload as unknown as OrderStatusUpdatedEmailData & {
              customerEmail: string;
            };
            const email = renderOrderStatusUpdatedEmail({
              ...payload,
              webAppUrl: this.webAppUrl,
            });

            await this.emailSender.sendEmail({
              to: payload.customerEmail,
              subject: email.subject,
              html: email.html,
              text: email.text,
            });
          }

          // Mark job as completed
          await this.db
            .update(outboxMessages)
            .set({
              status: "completed",
              processedAt: new Date(),
              lastError: null,
            })
            .where(eq(outboxMessages.id, job.id));

          processedCount++;
        } catch (err: unknown) {
          const error = err as Error;
          const newAttempts = job.attempts + 1;
          const maxAttempts = 5;

          // Exponential backoff: 2^attempts minutes
          const backoffMinutes = Math.pow(2, newAttempts);
          const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

          await this.db
            .update(outboxMessages)
            .set({
              status: newAttempts >= maxAttempts ? "failed" : "pending",
              attempts: newAttempts,
              lastError: error.message || "Failed to deliver email",
              nextRetryAt: nextRetryAt,
            })
            .where(eq(outboxMessages.id, job.id));
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return processedCount;
  }

  start(intervalMs: number = 5000) {
    if (this.timer) return;
    // Immediate initial check
    this.processBatch().catch(() => {});
    // Recurring polling loop
    this.timer = setInterval(() => {
      this.processBatch().catch(() => {});
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
