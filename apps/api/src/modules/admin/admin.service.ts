import { eq, desc, and, count, sum, sql } from "@hourlane/db";
import {
  type Database,
  admins,
  products,
  productImages,
  deliveryZones,
  orders,
  inventoryAdjustments,
  outboxMessages,
} from "@hourlane/db";

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

    // Update product stock and write audit record in inventory_adjustments
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

  async getOutboxMessages() {
    return this.db
      .select()
      .from(outboxMessages)
      .orderBy(desc(outboxMessages.createdAt))
      .limit(20);
  }
}

