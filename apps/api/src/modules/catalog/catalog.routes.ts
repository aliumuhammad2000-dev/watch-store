import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { CatalogService } from "./catalog.service.js";

const CatalogProductListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  brand: z.string(),
  sku: z.string(),
  priceKobo: z.number().int().positive(),
  condition: z.string(),
  stockQuantity: z.number().int().nonnegative(),
  deliveryEstimate: z.string(),
  images: z.array(z.string()),
  createdAt: z.date().or(z.string()),
});

const CatalogProductDetailSchema = CatalogProductListItemSchema.extend({
  movementType: z.string(),
  strapMaterial: z.string(),
  caseSizeMm: z.number().positive(),
  caseMaterial: z.string(),
  waterResistance: z.string(),
  warranty: z.string(),
  includedInBox: z.string(),
  description: z.string(),
  updatedAt: z.date().or(z.string()),
});

export const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  const catalogService = new CatalogService(fastify.db);
  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>();

  // 1. Public catalog list
  typedFastify.get(
    "/api/v1/products",
    {
      schema: {
        summary: "List published products",
        description:
          "Returns the public catalog of published watches, sorted newest first.",
        tags: ["Catalog"],
        response: {
          200: z.object({
            products: z.array(CatalogProductListItemSchema),
          }),
        },
      },
    },
    async () => {
      const products = await catalogService.getPublishedProducts();
      return { products };
    }
  );

  // 2. Product detail
  typedFastify.get(
    "/api/v1/products/:id",
    {
      schema: {
        summary: "Get product details",
        description: "Returns full product specifications and images for a watch.",
        tags: ["Catalog"],
        params: z.object({
          id: z.string().uuid("Invalid product ID"),
        }),
        response: {
          200: z.object({
            product: CatalogProductDetailSchema,
          }),
          404: z.object({
            statusCode: z.literal(404),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const product = await catalogService.getProductById(id);

      if (!product) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Product not found or is not currently available.",
        });
      }

      return { product };
    }
  );
};
