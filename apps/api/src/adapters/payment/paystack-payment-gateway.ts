import crypto from "node:crypto";
import {
  PaymentGateway,
  CheckoutParams,
  CheckoutResult,
  WebhookEvent,
} from "./payment-gateway.interface.js";

export class PaystackPaymentGateway implements PaymentGateway {
  constructor(
    private secretKey: string,
    private webhookSecret: string
  ) {}

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amountKobo, // Paystack takes NGN amount in kobo
        reference: params.orderNumber,
        callback_url: params.callbackUrl,
        metadata: {
          orderId: params.orderId,
          orderNumber: params.orderNumber,
          customerName: params.customerName,
          ...params.metadata,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Paystack transaction initialize failed: ${errorText}`);
    }

    const data = (await response.json()) as {
      status: boolean;
      message: string;
      data: {
        authorization_url: string;
        access_code: string;
        reference: string;
      };
    };

    if (!data.status || !data.data.authorization_url) {
      throw new Error(`Paystack API returned error: ${data.message}`);
    }

    return {
      checkoutUrl: data.data.authorization_url,
      providerReference: data.data.reference,
    };
  }

  async verifyWebhook(
    rawBody: string | Buffer,
    signature: string
  ): Promise<WebhookEvent | null> {
    const hash = crypto
      .createHmac("sha512", this.webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return null;
    }

    const payload = (typeof rawBody === "string" ? JSON.parse(rawBody) : JSON.parse(rawBody.toString("utf-8"))) as {
      event: string;
      data: {
        reference: string;
        amount: number;
        currency: string;
        channel?: string;
        paid_at?: string;
        [key: string]: unknown;
      };
    };

    return {
      event: payload.event,
      reference: payload.data.reference,
      amountKobo: payload.data.amount,
      currency: payload.data.currency || "NGN",
      channel: payload.data.channel,
      paidAt: payload.data.paid_at ? new Date(payload.data.paid_at) : new Date(),
      rawPayload: payload,
    };
  }
}
