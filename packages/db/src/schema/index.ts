import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { ORDER_STATUSES } from "@hourlane/shared";

// Enums
export const orderStatusEnum = pgEnum("order_status", ORDER_STATUSES);

export const stockReservationStatusEnum = pgEnum("stock_reservation_status", [
  "active",
  "consumed",
  "released",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "successful",
  "failed",
]);

export const refundStatusEnum = pgEnum("refund_status", [
  "pending",
  "approved",
  "rejected",
  "successful",
  "failed",
]);

export const outboxStatusEnum = pgEnum("outbox_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

// 1. Admins
export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Delivery Zones
export const deliveryZones = pgTable("delivery_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  cityName: text("city_name").notNull(),
  cityCode: text("city_code").notNull().unique(),
  feeKobo: integer("fee_kobo").notNull(), // NGN kobo
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Products
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  sku: text("sku").notNull().unique(),
  priceKobo: integer("price_kobo").notNull(), // NGN kobo
  condition: text("condition").default("brand_new").notNull(),
  movementType: text("movement_type").notNull(),
  strapMaterial: text("strap_material").notNull(),
  caseSizeMm: integer("case_size_mm").notNull(),
  caseMaterial: text("case_material").notNull(),
  waterResistance: text("water_resistance").notNull(),
  warranty: text("warranty").notNull(),
  includedInBox: text("included_in_box").notNull(),
  description: text("description").notNull(),
  deliveryEstimate: text("delivery_estimate")
    .default("Delivery within 2–5 business days")
    .notNull(),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Product Images
export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  r2Key: text("r2_key").notNull(),
  url: text("url").notNull(),
  altText: text("alt_text").default("").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Orders (with immutable snapshots for V1 single-item purchase)
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  status: orderStatusEnum("status").default("pending_payment").notNull(),
  
  // Snapshot of purchased watch
  productId: uuid("product_id").references(() => products.id).notNull(),
  snapshotProductName: text("snapshot_product_name").notNull(),
  snapshotBrand: text("snapshot_brand").notNull(),
  snapshotSku: text("snapshot_sku").notNull(),
  snapshotUnitPriceKobo: integer("snapshot_unit_price_kobo").notNull(),

  // Customer contact details
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),

  // Snapshot of delivery zone & address
  deliveryZoneId: uuid("delivery_zone_id").references(() => deliveryZones.id).notNull(),
  snapshotDeliveryCity: text("snapshot_delivery_city").notNull(),
  snapshotDeliveryFeeKobo: integer("snapshot_delivery_fee_kobo").notNull(),
  streetAddress: text("street_address").notNull(),
  areaLocality: text("area_locality").notNull(),
  landmark: text("landmark"),
  deliveryNotes: text("delivery_notes"),

  // Financial totals
  subtotalKobo: integer("subtotal_kobo").notNull(),
  deliveryFeeKobo: integer("delivery_fee_kobo").notNull(),
  totalKobo: integer("total_kobo").notNull(),
  currency: text("currency").default("NGN").notNull(),

  // Secure token for single-order lookup via email link
  secureStatusToken: text("secure_status_token").notNull().unique(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Stock Reservations (15-minute hold)
export const stockReservations = pgTable("stock_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  status: stockReservationStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. Payments
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  provider: text("provider").default("paystack").notNull(),
  providerReference: text("provider_reference").notNull().unique(),
  amountKobo: integer("amount_kobo").notNull(),
  currency: text("currency").default("NGN").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  channel: text("channel"),
  metadata: jsonb("metadata"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. Refunds
export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  paymentId: uuid("payment_id").references(() => payments.id).notNull(),
  amountKobo: integer("amount_kobo").notNull(),
  reason: text("reason").notNull(),
  status: refundStatusEnum("status").default("pending").notNull(),
  providerRefundId: text("provider_refund_id"),
  approvedByAdminId: uuid("approved_by_admin_id").references(() => admins.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. Inventory Adjustments (Audit Trail)
export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  quantityDelta: integer("quantity_delta").notNull(),
  reason: text("reason").notNull(),
  adminId: uuid("admin_id").references(() => admins.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. Order Status Events (Audit History)
export const orderStatusEvents = pgTable("order_status_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  reason: text("reason"),
  triggeredBy: text("triggered_by").notNull(), // 'system', 'webhook', or 'admin:<id>'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 11. Outbox Messages (Reliable background job dispatch)
export const outboxMessages = pgTable("outbox_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(), // e.g., 'email.order_confirmed'
  payload: jsonb("payload").notNull(),
  status: outboxStatusEnum("status").default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  lastError: text("last_error"),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  images: many(productImages),
  reservations: many(stockReservations),
  adjustments: many(inventoryAdjustments),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  deliveryZone: one(deliveryZones, {
    fields: [orders.deliveryZoneId],
    references: [deliveryZones.id],
  }),
  payments: many(payments),
  refunds: many(refunds),
  statusEvents: many(orderStatusEvents),
  reservations: many(stockReservations),
}));
