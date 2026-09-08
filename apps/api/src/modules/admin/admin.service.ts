import { eq, desc, and, count, sum, sql, or, ilike, inArray } from "@hourlane/db";
import {
  type Database,
  admins,
  products,
  productImages,
  deliveryZones,
  orders,
  payments,
  refunds,
  orderStatusEvents,
  stockReservations,
  inventoryAdjustments,
  outboxMessages,
} from "@hourlane/db";
import type { PaymentGateway } from "../../adapters/payment/payment-gateway.interface.js";

export interface CreateProductInput {
  name: string;
  brand: string;
  sku: string;
  priceKobo: number;
  condition?: string;
  movementType: string;
  strapMaterial: string;
  caseSizeMm: number;
  caseMaterial: string;
  waterResistance: string;
  warranty: string;
  includedInBox: string;
  description: string;
  deliveryEstimate?: string;
  stockQuantity: number;
  isPublished?: boolean;
  images: Array<{ url: string; altText?: string; r2Key?: string }>;
}

export interface UpdateProductInput {
  name?: string;
  brand?: string;
  sku?: string;
  priceKobo?: number;
  movementType?: string;
  strapMaterial?: string;
  caseSizeMm?: number;
  caseMaterial?: string;
  waterResistance?: string;
  warranty?: string;
  includedInBox?: string;
  description?: string;
  deliveryEstimate?: string;
  isPublished?: boolean;
}

export interface OrderFilters {
  search?: string;
  status?: string;
  cityCode?: string;
  limit?: number;
  offset?: number;
}

export class AdminService {
  constructor(private db: Database) {}

  async getAdminByEmail(email: string) {
    const results = await this.db
      .select()
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);
    return results[0] ?? null;
  }

  async seedPrimaryAdmin(email: string, name: string) {
    const existing = await this.getAdminByEmail(email);
    if (existing) {
      return existing;
    }

    const inserted = await this.db
      .insert(admins)
      .values({
        email,
        name,
        clerkUserId: `seed_${Date.now()}`,
        isActive: true,
      })
      .returning();

    return inserted[0];
  }

  async getOverviewStats() {
    // 1. Total paid orders and revenue
    const revenueResult = await this.db
      .select({
        totalRevenueKobo: sum(orders.totalKobo),
        paidOrdersCount: count(orders.id),
      })
      .from(orders)
      .where(eq(orders.status, "paid"));

    // 2. Pending fulfilment (paid or processing)
    const pendingFulfilmentResult = await this.db
      .select({ count: count(orders.id) })
      .from(orders)
      .where(sql`${orders.status} IN ('paid', 'processing')`);

    // 3. Out of stock products
    const outOfStockResult = await this.db
      .select({ count: count(products.id) })
      .from(products)
      .where(eq(products.stockQuantity, 0));

    // 4. Recent orders
    const recentOrders = await this.db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(10);

    return {
      revenueKobo: Number(revenueResult[0]?.totalRevenueKobo || 0),
      paidOrdersCount: Number(revenueResult[0]?.paidOrdersCount || 0),
      pendingFulfilmentCount: Number(pendingFulfilmentResult[0]?.count || 0),
      outOfStockProductsCount: Number(outOfStockResult[0]?.count || 0),
      recentOrders,
    };
  }

  // --- Orders Management ---

  async getOrders(filters: OrderFilters = {}) {
    const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
    const offset = Math.max(0, filters.offset ?? 0);

    const conditions = [];

    if (filters.search) {
      const s = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(orders.orderNumber, s),
          ilike(orders.customerEmail, s),
          ilike(orders.customerName, s),
          ilike(orders.customerPhone, s)
        )
      );
    }

    if (filters.status) {
      conditions.push(sql`${orders.status} = ${filters.status}`);
    }

    if (filters.cityCode) {
      conditions.push(ilike(orders.snapshotDeliveryCity, `%${filters.cityCode}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await this.db
      .select({ total: count(orders.id) })
      .from(orders)
      .where(whereClause);

    const orderList = await this.db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      orders: orderList,
      total: Number(countResult?.total ?? 0),
      limit,
      offset,
    };
  }

  async getOrderById(orderId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return null;
    }

    // Fetch related payment records
    const orderPayments = await this.db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt));

    // Fetch status events
    const statusEvents = await this.db
      .select()
      .from(orderStatusEvents)
      .where(eq(orderStatusEvents.orderId, orderId))
      .orderBy(desc(orderStatusEvents.createdAt));

    // Fetch refunds
    const orderRefunds = await this.db
      .select()
      .from(refunds)
      .where(eq(refunds.orderId, orderId))
      .orderBy(desc(refunds.createdAt));

    return {
      ...order,
      payments: orderPayments,
      statusEvents,
      refunds: orderRefunds,
    };
  }

  async updateOrderStatus(
    orderId: string,
    toStatus:
      | "pending_payment"
      | "paid"
      | "processing"
      | "out_for_delivery"
      | "delivered"
      | "cancelled"
      | "refund_processing"
      | "refunded"
      | "refund_failed",
    reason: string | undefined,
    adminId: string,
    webAppUrl: string
  ) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error("Order not found");
    }

    const fromStatus = order.status;
    if (fromStatus === toStatus) {
      return order;
    }

    // Update order status
    const [updatedOrder] = await this.db
      .update(orders)
      .set({
        status: toStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Record order status event audit
    await this.db.insert(orderStatusEvents).values({
      orderId,
      fromStatus,
      toStatus,
      reason: reason || `Updated to ${toStatus} by admin`,
      triggeredBy: `admin:${adminId}`,
    });

    // If cancelled, release any active stock reservation
    if (toStatus === "cancelled") {
      await this.db
        .update(stockReservations)
        .set({ status: "released" })
        .where(
          and(
            eq(stockReservations.orderId, orderId),
            eq(stockReservations.status, "active")
          )
        );
    }

    // Enqueue transactional email notification to outbox
    await this.db.insert(outboxMessages).values({
      eventType: "email.status_updated",
      payload: {
        orderId,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        productName: order.snapshotProductName,
        status: toStatus,
        secureStatusToken: order.secureStatusToken,
        webAppUrl,
      },
      status: "pending",
      attempts: 0,
    });

    return updatedOrder;
  }

  async updateOrderAddress(
    orderId: string,
    address: {
      streetAddress: string;
      areaLocality: string;
      landmark?: string;
      deliveryNotes?: string;
    },
    reason: string,
    adminId: string
  ) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error("Order not found");
    }

    // Version 1 specification: Address can only be edited before dispatch
    if (order.status !== "paid" && order.status !== "processing") {
      throw new Error(
        `Delivery address cannot be modified once order status is '${order.status}'. Address edits are only permitted prior to dispatch.`
      );
    }

    const previousAddress = `${order.streetAddress}, ${order.areaLocality}`;
    const newAddress = `${address.streetAddress}, ${address.areaLocality}`;

    const [updated] = await this.db
      .update(orders)
      .set({
        streetAddress: address.streetAddress,
        areaLocality: address.areaLocality,
        landmark: address.landmark ?? order.landmark,
        deliveryNotes: address.deliveryNotes ?? order.deliveryNotes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Record audit event in orderStatusEvents
    await this.db.insert(orderStatusEvents).values({
      orderId,
      fromStatus: order.status,
      toStatus: order.status,
      reason: `Address modified: '${previousAddress}' -> '${newAddress}'. Reason: ${reason}`,
      triggeredBy: `admin:${adminId}`,
    });

    return updated;
  }

  // --- Refunds Workflow ---

  async processRefund(
    orderId: string,
    reason: string,
    adminId: string,
    paymentGateway: PaymentGateway,
    webAppUrl: string
  ) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error("Order not found");
    }

    if (
      order.status !== "paid" &&
      order.status !== "processing" &&
      order.status !== "cancelled" &&
      order.status !== "refund_failed"
    ) {
      throw new Error(`Order cannot be refunded from current status '${order.status}'`);
    }

    // Find successful payment
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.status, "successful")))
      .limit(1);

    if (!payment) {
      throw new Error("No successful payment record found to refund for this order");
    }

    // Insert refund record in 'approved' status
    const [refundRecord] = await this.db
      .insert(refunds)
      .values({
        orderId,
        paymentId: payment.id,
        amountKobo: payment.amountKobo,
        reason,
        status: "approved",
        approvedByAdminId: adminId,
      })
      .returning();

    // Update order status to refund_processing
    await this.db
      .update(orders)
      .set({
        status: "refund_processing",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    await this.db.insert(orderStatusEvents).values({
      orderId,
      fromStatus: order.status,
      toStatus: "refund_processing",
      reason: `Refund approved by admin: ${reason}`,
      triggeredBy: `admin:${adminId}`,
    });

    try {
      // Call payment gateway to initiate refund
      const result = await paymentGateway.initiateRefund({
        reference: payment.providerReference,
        amountKobo: payment.amountKobo,
        merchantNote: `Hourlane refund: ${reason}`,
      });

      const finalStatus: "successful" | "failed" | "approved" =
        result.status === "processed"
          ? "successful"
          : result.status === "failed"
          ? "failed"
          : "approved";

      const finalOrderStatus =
        finalStatus === "successful"
          ? "refunded"
          : finalStatus === "failed"
          ? "refund_failed"
          : "refund_processing";

      // Update refund record
      await this.db
        .update(refunds)
        .set({
          status: finalStatus,
          providerRefundId: result.refundId,
          updatedAt: new Date(),
        })
        .where(eq(refunds.id, refundRecord.id));

      // Update order status
      await this.db
        .update(orders)
        .set({
          status: finalOrderStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      await this.db.insert(orderStatusEvents).values({
        orderId,
        fromStatus: "refund_processing",
        toStatus: finalOrderStatus,
        reason: `Payment provider refund status: ${result.status} (ID: ${result.refundId})`,
        triggeredBy: `admin:${adminId}`,
      });

      // Enqueue notification outbox message
      await this.db.insert(outboxMessages).values({
        eventType: "email.status_updated",
        payload: {
          orderId,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          productName: order.snapshotProductName,
          status: finalOrderStatus,
          secureStatusToken: order.secureStatusToken,
          webAppUrl,
        },
        status: "pending",
        attempts: 0,
      });

      return {
        refundId: refundRecord.id,
        providerRefundId: result.refundId,
        orderStatus: finalOrderStatus,
        refundStatus: finalStatus,
      };
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Provider refund failed";

      await this.db
        .update(refunds)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(refunds.id, refundRecord.id));

      await this.db
        .update(orders)
        .set({
          status: "refund_failed",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      await this.db.insert(orderStatusEvents).values({
        orderId,
        fromStatus: "refund_processing",
        toStatus: "refund_failed",
        reason: `Gateway refund error: ${errMessage}`,
        triggeredBy: `admin:${adminId}`,
      });

      throw error;
    }
  }

  // --- Products Management ---

  async createProduct(input: CreateProductInput) {
    const [newProduct] = await this.db
      .insert(products)
      .values({
        name: input.name,
        brand: input.brand,
        sku: input.sku,
        priceKobo: input.priceKobo,
        condition: input.condition || "brand_new",
        movementType: input.movementType,
        strapMaterial: input.strapMaterial,
        caseSizeMm: input.caseSizeMm,
        caseMaterial: input.caseMaterial,
        waterResistance: input.waterResistance,
        warranty: input.warranty,
        includedInBox: input.includedInBox,
        description: input.description,
        deliveryEstimate: input.deliveryEstimate || "Delivery within 2–5 business days",
        stockQuantity: Math.max(0, input.stockQuantity),
        isPublished: input.isPublished ?? false,
      })
      .returning();

    if (input.images && input.images.length > 0) {
      await this.db.insert(productImages).values(
        input.images.map((img, index) => ({
          productId: newProduct.id,
          r2Key: img.r2Key || `prod_${newProduct.id}_${index}`,
          url: img.url,
          altText: img.altText || newProduct.name,
          displayOrder: index,
        }))
      );
    }

    return newProduct;
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const [existing] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      throw new Error("Product not found");
    }

    const [updated] = await this.db
      .update(products)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return updated;
  }

  async toggleProductPublish(id: string, isPublished: boolean) {
    const [existing] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      throw new Error("Product not found");
    }

    const [updated] = await this.db
      .update(products)
      .set({
        isPublished,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return updated;
  }

  async adjustProductStock(
    productId: string,
    quantityDelta: number,
    reason: string,
    adminId: string
  ) {
    const [existing] = await this.db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existing) {
      throw new Error("Product not found");
    }

    const newStock = existing.stockQuantity + quantityDelta;
    if (newStock < 0) {
      throw new Error("Stock cannot become negative");
    }

    const [updatedProduct] = await this.db
      .update(products)
      .set({
        stockQuantity: newStock,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    await this.db.insert(inventoryAdjustments).values({
      productId,
      quantityDelta,
      reason,
      adminId,
    });

    return updatedProduct;
  }

  // --- Delivery Zones Management ---

  async getDeliveryZones() {
    return this.db
      .select()
      .from(deliveryZones)
      .orderBy(deliveryZones.cityName);
  }

  async createDeliveryZone(input: {
    cityName: string;
    cityCode: string;
    feeKobo: number;
    isActive?: boolean;
  }) {
    const [zone] = await this.db
      .insert(deliveryZones)
      .values({
        cityName: input.cityName,
        cityCode: input.cityCode.toUpperCase(),
        feeKobo: input.feeKobo,
        isActive: input.isActive ?? true,
      })
      .returning();

    return zone;
  }

  async updateDeliveryZone(
    id: string,
    input: Partial<{ cityName: string; feeKobo: number; isActive: boolean }>
  ) {
    const [existing] = await this.db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.id, id))
      .limit(1);

    if (!existing) {
      throw new Error("Delivery zone not found");
    }

    const [updated] = await this.db
      .update(deliveryZones)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(deliveryZones.id, id))
      .returning();

    return updated;
  }

  // --- Outbox Monitoring ---

  async getOutboxMessages() {
    return this.db
      .select()
      .from(outboxMessages)
      .orderBy(desc(outboxMessages.createdAt))
      .limit(50);
  }
}
