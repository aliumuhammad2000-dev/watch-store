import crypto from "node:crypto";
import { eq, and, sql } from "@hourlane/db";
import {
  type Database,
  orders,
  products,
  deliveryZones,
  stockReservations,
  payments,
  orderStatusEvents,
  outboxMessages,
} from "@hourlane/db";
import { CheckoutInput } from "@hourlane/shared";
import { PaymentGateway } from "../../adapters/payment/payment-gateway.interface.js";

export class OrdersService {
  constructor(
    private db: Database,
    private paymentGateway: PaymentGateway,
    private webAppUrl: string
  ) {}

  async initiateCheckout(input: CheckoutInput) {
    // 1. Validate Product Availability
    const [product] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, input.productId), eq(products.isPublished, true)))
      .limit(1);

    if (!product) {
      throw new Error("Product is not available for purchase");
    }

    if (product.stockQuantity <= 0) {
      throw new Error("This watch is currently sold out");
    }

    // 2. Validate Active Delivery Zone
    const [zone] = await this.db
      .select()
      .from(deliveryZones)
      .where(and(eq(deliveryZones.id, input.deliveryZoneId), eq(deliveryZones.isActive, true)))
      .limit(1);

    if (!zone) {
      throw new Error("Selected delivery city is not available");
    }

    // 3. Calculate Immutable Totals in Integer Kobo
    const subtotalKobo = product.priceKobo;
    const deliveryFeeKobo = zone.feeKobo;
    const totalKobo = subtotalKobo + deliveryFeeKobo;

    // 4. Generate Identifiers
    const timestampPart = Date.now().toString().slice(-6);
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `HLW-${timestampPart}-${randomPart}`;
    const secureStatusToken = crypto.randomBytes(24).toString("hex");

    // 5. Create Order with Immutable Snapshots
    const [newOrder] = await this.db
      .insert(orders)
      .values({
        orderNumber,
        status: "pending_payment",

        // Product snapshot
        productId: product.id,
        snapshotProductName: product.name,
        snapshotBrand: product.brand,
        snapshotSku: product.sku,
        snapshotUnitPriceKobo: product.priceKobo,

        // Customer details
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,

        // Delivery snapshot
        deliveryZoneId: zone.id,
        snapshotDeliveryCity: zone.cityName,
        snapshotDeliveryFeeKobo: zone.feeKobo,
        streetAddress: input.streetAddress,
        areaLocality: input.areaLocality,
        landmark: input.landmark,
        deliveryNotes: input.deliveryNotes,

        // Amounts
        subtotalKobo,
        deliveryFeeKobo,
        totalKobo,
        currency: "NGN",

        secureStatusToken,
      })
      .returning();

    // 6. Create 15-Minute Stock Reservation
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.db.insert(stockReservations).values({
      productId: product.id,
      orderId: newOrder.id,
      quantity: 1,
      expiresAt,
      status: "active",
    });

    // 7. Record Order Creation Event
    await this.db.insert(orderStatusEvents).values({
      orderId: newOrder.id,
      fromStatus: null,
      toStatus: "pending_payment",
      reason: "Checkout initiated by customer",
      triggeredBy: "customer",
    });

    // 8. Initialize Payment Gateway Transaction
    const callbackUrl = `${this.webAppUrl}/payment-result?orderNumber=${orderNumber}`;
    const checkoutResult = await this.paymentGateway.createCheckout({
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      amountKobo: totalKobo,
      email: input.customerEmail,
      customerName: input.customerName,
      callbackUrl,
    });

    // 9. Record Pending Payment
    await this.db.insert(payments).values({
      orderId: newOrder.id,
      provider: "paystack",
      providerReference: checkoutResult.providerReference,
      amountKobo: totalKobo,
      currency: "NGN",
      status: "pending",
    });

    return {
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      totalKobo: newOrder.totalKobo,
      secureStatusToken: newOrder.secureStatusToken,
      checkoutUrl: checkoutResult.checkoutUrl,
    };
  }

  async handlePaymentWebhookSuccess(reference: string, channel?: string, paidAt?: Date) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, reference))
      .limit(1);

    if (!order) {
      return null;
    }

    if (order.status === "paid") {
      return order; // Idempotent: already processed
    }

    // 1. Mark Order Paid
    await this.db
      .update(orders)
      .set({
        status: "paid",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    // 2. Mark Payment Successful
    await this.db
      .update(payments)
      .set({
        status: "successful",
        channel: channel || "unknown",
        paidAt: paidAt || new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.orderId, order.id));

    // 3. Decrement Product Stock Safely
    await this.db
      .update(products)
      .set({
        stockQuantity: sql`GREATEST(0, ${products.stockQuantity} - 1)`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, order.productId));

    // 4. Consume Stock Reservation
    await this.db
      .update(stockReservations)
      .set({
        status: "consumed",
      })
      .where(eq(stockReservations.orderId, order.id));

    // 5. Record Audit Event
    await this.db.insert(orderStatusEvents).values({
      orderId: order.id,
      fromStatus: "pending_payment",
      toStatus: "paid",
      reason: "Payment verified via Paystack webhook",
      triggeredBy: "webhook:paystack",
    });

    // 6. Enqueue Outbox Email Notification Job
    await this.db.insert(outboxMessages).values({
      eventType: "email.order_confirmed",
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        productName: order.snapshotProductName,
        totalKobo: order.totalKobo,
        secureStatusToken: order.secureStatusToken,
      },
      status: "pending",
    });

    return order;
  }

  async getOrderBySecureToken(token: string) {
    const [order] = await this.db
      .select({
        orderNumber: orders.orderNumber,
        status: orders.status,
        productName: orders.snapshotProductName,
        brand: orders.snapshotBrand,
        sku: orders.snapshotSku,
        unitPriceKobo: orders.snapshotUnitPriceKobo,
        deliveryCity: orders.snapshotDeliveryCity,
        deliveryFeeKobo: orders.snapshotDeliveryFeeKobo,
        totalKobo: orders.totalKobo,
        streetAddress: orders.streetAddress,
        areaLocality: orders.areaLocality,
        customerName: orders.customerName,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(eq(orders.secureStatusToken, token))
      .limit(1);

    return order ?? null;
  }
}
