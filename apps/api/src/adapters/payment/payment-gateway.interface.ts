export interface CheckoutParams {
  orderId: string;
  orderNumber: string;
  amountKobo: number;
  email: string;
  customerName: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface CheckoutResult {
  checkoutUrl: string;
  providerReference: string;
}

export interface WebhookEvent {
  event: string;
  reference: string;
  amountKobo: number;
  currency: string;
  channel?: string;
  paidAt?: Date;
  rawPayload: unknown;
}

export interface PaymentGateway {
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  verifyWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookEvent | null>;
}
