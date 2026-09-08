import { z } from "zod";

// Currency & Monetary Rules
export const CURRENCY = "NGN" as const;
export type Currency = typeof CURRENCY;

// Order Lifecycle Statuses
export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund_processing",
  "refunded",
  "refund_failed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Nigerian Phone Number RegEx (e.g. +234..., 080..., 070..., 090..., 081...)
export const NIGERIAN_PHONE_REGEX = /^(?:\+234|0)[789][01]\d{8}$/;

// Checkout Form Validation Schema (Guest Single-Item Buy Now)
export const CheckoutSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  deliveryZoneId: z.string().uuid("Invalid delivery zone ID"),
  customerName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z
    .string()
    .regex(NIGERIAN_PHONE_REGEX, "Please provide a valid Nigerian phone number"),
  streetAddress: z.string().min(5, "Street address must be at least 5 characters").max(255),
  areaLocality: z.string().min(2, "Area/locality must be at least 2 characters").max(100),
  landmark: z.string().max(150).optional(),
  deliveryNotes: z.string().max(300).optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms and Privacy Policy" }),
  }),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;

// Delivery Zone DTO
export const DeliveryZoneSchema = z.object({
  id: z.string().uuid(),
  cityName: z.string(),
  cityCode: z.string(),
  feeKobo: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type DeliveryZone = z.infer<typeof DeliveryZoneSchema>;

// Product DTO
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  brand: z.string(),
  sku: z.string(),
  priceKobo: z.number().int().positive(),
  condition: z.literal("brand_new"),
  movementType: z.string(),
  strapMaterial: z.string(),
  caseSizeMm: z.number().positive(),
  caseMaterial: z.string(),
  waterResistance: z.string(),
  warranty: z.string(),
  includedInBox: z.string(),
  description: z.string(),
  deliveryEstimate: z.string().default("Delivery within 2–5 business days"),
  stockQuantity: z.number().int().nonnegative(),
  isPublished: z.boolean(),
  images: z.array(z.string().url()),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type Product = z.infer<typeof ProductSchema>;

// Monetary & Currency Helpers
export function koboToNgn(kobo: number): number {
  return kobo / 100;
}

export function ngnToKobo(ngn: number): number {
  return Math.round(ngn * 100);
}

export function formatKoboToNgn(kobo: number): string {
  const ngn = koboToNgn(kobo);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(ngn);
}
