import {
  PaymentGateway,
  CheckoutParams,
  CheckoutResult,
  WebhookEvent,
} from "./payment-gateway.interface.js";

export class MockPaymentGateway implements PaymentGateway {
  constructor(private webAppUrl: string = "http://localhost:5173") {}

  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    // Return mock payment return URL for local development
    return {
      checkoutUrl: `${this.webAppUrl}/payment-result?reference=${params.orderNumber}&mock_success=true`,
      providerReference: `mock_ref_${params.orderNumber}`,
    };
  }

  async verifyWebhook(
    rawBody: string | Buffer,
    signature: string
  ): Promise<WebhookEvent | null> {
    if (signature === "mock-signature" || signature.startsWith("mock_")) {
      const payload = JSON.parse(
        typeof rawBody === "string" ? rawBody : rawBody.toString("utf-8")
      );
      return {
        event: payload.event || "charge.success",
        reference: payload.reference || "HLW-TEST",
        amountKobo: payload.amountKobo || 85000000,
        currency: "NGN",
        channel: "card",
        paidAt: new Date(),
        rawPayload: payload,
      };
    }
    return null;
  }

  async initiateRefund(params: {
    reference: string;
    amountKobo?: number;
    merchantNote: string;
  }) {
    return {
      refundId: `mock_rf_${Date.now()}`,
      status: "processed" as const,
      amountKobo: params.amountKobo ?? 0,
      rawPayload: { mock: true, reference: params.reference, note: params.merchantNote },
    };
  }
}
