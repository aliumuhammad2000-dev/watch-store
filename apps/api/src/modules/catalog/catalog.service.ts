import { eq, desc, and, type Database, products, productImages } from "@hourlane/db";

export class CatalogService {
  constructor(private db: Database) {}

  async getPublishedProducts() {
    // Newest published first per Version 1 specification
    const items = await this.db
      .select({
        id: products.id,
        name: products.name,
        brand: products.brand,
        sku: products.sku,
        priceKobo: products.priceKobo,
        condition: products.condition,
        stockQuantity: products.stockQuantity,
        deliveryEstimate: products.deliveryEstimate,
        createdAt: products.createdAt,
      })
      .from(products)
      .where(eq(products.isPublished, true))
      .orderBy(desc(products.createdAt));

    // Attach primary image for each product
    const productListWithImages = await Promise.all(
      items.map(async (item) => {
        const images = await this.db
          .select({
            url: productImages.url,
            altText: productImages.altText,
          })
          .from(productImages)
          .where(eq(productImages.productId, item.id))
          .orderBy(productImages.displayOrder);

        return {
          ...item,
          images: images.map((img) => img.url),
        };
      })
    );

    return productListWithImages;
  }

  async getProductById(id: string) {
    const results = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.isPublished, true)))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const product = results[0];

    const images = await this.db
      .select({
        url: productImages.url,
        altText: productImages.altText,
      })
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.displayOrder);

    return {
      ...product,
      images: images.map((img) => img.url),
    };
  }
}
