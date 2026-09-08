import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AdminService } from "./admin.service.js";

const CreateProductSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(1),
  sku: z.string().min(2),
  priceKobo: z.number().int().positive("Price must be a positive integer in kobo"),
  condition: z.literal("brand_new").default("brand_new"),
  movementType: z.string().min(2),
  strapMaterial: z.string().min(2),
  caseSizeMm: z.number().positive(),
  caseMaterial: z.string().min(2),
  waterResistance: z.string().min(2),
  warranty: z.string().min(2),
  includedInBox: z.string().min(2),
  description: z.string().min(10),
  deliveryEstimate: z.string().default("Delivery within 2–5 business days"),
  stockQuantity: z.number().int().nonnegative(),
  isPublished: z.boolean().default(false),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        altText: z.string().optional(),
        r2Key: z.string().optional(),
      })
    )
    .min(1, "At least one product image is required")
    .max(4, "A maximum of four product images are allowed in Version 1"),
});

const AdjustStockSchema = z.object({
  quantityDelta: z
    .number()
    .int()
    .refine((val) => val !== 0, "quantityDelta cannot be zero"),
  reason: z.string().min(3, "A valid reason is required for stock adjustment"),
});

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const adminService = new AdminService(fastify.db);
  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>();

  // 1. Seed Primary Admin (Public bootstrap endpoint if admins table is empty or for specified admin email)
  typedFastify.post(
    "/api/v1/admin/seed",
    {
      schema: {
        summary: "Seed primary administrator",
        description:
          "Registers the store owner's Google account email into the admins database table.",
        tags: ["Admin"],
        body: z.object({
          email: z.string().email(),
          name: z.string().min(2),
        }),
        response: {
          200: z.object({
            message: z.string(),
            admin: z.object({
              id: z.string(),
              email: z.string(),
              name: z.string(),
              isActive: z.boolean(),
            }),
          }),
        },
      },
    },
    async (request) => {
      const admin = await adminService.seedPrimaryAdmin(
        request.body.email,
        request.body.name
      );
      return {
        message: "Admin registered successfully",
        admin,
      };
    }
  );

  // Protected Admin Routes Sub-plugin
  await typedFastify.register(async (instance) => {
    const protectedRoutes = instance.withTypeProvider<ZodTypeProvider>();
    // Enforce admin authentication hook for all routes in this sub-scope
    protectedRoutes.addHook("onRequest", fastify.authenticateAdmin);

    // 2. Get current admin
    protectedRoutes.get(
      "/api/v1/admin/me",
      {
        schema: {
          summary: "Get current admin profile",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              admin: z.object({
                id: z.string(),
                email: z.string(),
                name: z.string(),
                clerkUserId: z.string(),
              }),
            }),
          },
        },
      },
      async (request) => {
        return { admin: request.admin! };
      }
    );

    // 3. Admin Overview Dashboard Stats
    protectedRoutes.get(
      "/api/v1/admin/overview",
      {
        schema: {
          summary: "Get admin overview dashboard",
          description:
            "Returns revenue in kobo, paid orders, pending fulfilment, out of stock count, and recent orders.",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
        },
      },
      async () => {
        return adminService.getOverviewStats();
      }
    );

    // 4. Create Product
    protectedRoutes.post(
      "/api/v1/admin/products",
      {
        schema: {
          summary: "Create a new watch product",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          body: CreateProductSchema,
          response: {
            201: z.object({
              message: z.string(),
              productId: z.string(),
            }),
          },
        },
      },
      async (request, reply) => {
        const product = await adminService.createProduct(request.body);
        return reply.status(201).send({
          message: "Product created successfully",
          productId: product.id,
        });
      }
    );

    // 5. Adjust Product Stock with Audit Reason
    protectedRoutes.post(
      "/api/v1/admin/products/:id/adjust-stock",
      {
        schema: {
          summary: "Adjust product inventory stock",
          description:
            "Increases or decreases watch stock and records an immutable inventory audit log.",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: AdjustStockSchema,
          response: {
            200: z.object({
              message: z.string(),
              productId: z.string(),
              newStockQuantity: z.number(),
            }),
          },
        },
      },
      async (request) => {
        const { id } = request.params;
        const { quantityDelta, reason } = request.body;
        const updated = await adminService.adjustProductStock(
          id,
          quantityDelta,
          reason,
          request.admin!.id
        );

        return {
          message: "Stock adjusted successfully",
          productId: updated.id,
          newStockQuantity: updated.stockQuantity,
        };
      }
    );

    // 6. View Outbox Messages
    protectedRoutes.get(
      "/api/v1/admin/outbox",
      {
        schema: {
          summary: "List outbox background messages",
          description:
            "Returns recent outbox jobs and their dispatch status, attempts, and last error.",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
        },
      },
      async () => {
        const messages = await adminService.getOutboxMessages();
        return { messages };
      }
    );
  });
};
