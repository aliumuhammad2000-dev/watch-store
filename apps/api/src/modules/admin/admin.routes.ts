import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ORDER_STATUSES, type OrderStatus } from "@hourlane/shared";
import { AdminService } from "./admin.service.js";
import type { PaymentGateway } from "../../adapters/payment/payment-gateway.interface.js";

export interface AdminRoutesOptions {
  paymentGateway?: PaymentGateway;
  webAppUrl?: string;
}

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

const UpdateProductSchema = z.object({
  name: z.string().min(2).optional(),
  brand: z.string().min(1).optional(),
  sku: z.string().min(2).optional(),
  priceKobo: z.number().int().positive().optional(),
  movementType: z.string().min(2).optional(),
  strapMaterial: z.string().min(2).optional(),
  caseSizeMm: z.number().positive().optional(),
  caseMaterial: z.string().min(2).optional(),
  waterResistance: z.string().min(2).optional(),
  warranty: z.string().min(2).optional(),
  includedInBox: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  deliveryEstimate: z.string().optional(),
  isPublished: z.boolean().optional(),
});

const AdjustStockSchema = z.object({
  quantityDelta: z
    .number()
    .int()
    .refine((val) => val !== 0, "quantityDelta cannot be zero"),
  reason: z.string().min(3, "A valid reason is required for stock adjustment"),
});

const UpdateOrderStatusSchema = z.object({
  toStatus: z.enum(ORDER_STATUSES),
  reason: z.string().optional(),
});

const UpdateOrderAddressSchema = z.object({
  streetAddress: z.string().min(5).max(255),
  areaLocality: z.string().min(2).max(100),
  landmark: z.string().max(150).optional(),
  deliveryNotes: z.string().max(300).optional(),
  reason: z.string().min(3, "Reason for modifying delivery address is required"),
});

const RefundOrderSchema = z.object({
  reason: z.string().min(3, "Reason for refund is required"),
  approve: z.boolean().default(true),
});

const CreateDeliveryZoneSchema = z.object({
  cityName: z.string().min(2),
  cityCode: z.string().min(2).max(10),
  feeKobo: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
});

const UpdateDeliveryZoneSchema = z.object({
  cityName: z.string().min(2).optional(),
  feeKobo: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const adminRoutes: FastifyPluginAsync<AdminRoutesOptions> = async (
  fastify,
  opts
) => {
  const adminService = new AdminService(fastify.db);
  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>();
  const webAppUrl = opts.webAppUrl || "http://localhost:5173";

  // 1. Seed Primary Admin (Public bootstrap endpoint)
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
    protectedRoutes.addHook("onRequest", fastify.authenticateAdmin);

    // 2. Current Admin Profile
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

    // 4. List / Filter Orders
    protectedRoutes.get(
      "/api/v1/admin/orders",
      {
        schema: {
          summary: "List and filter store orders",
          description:
            "Search orders by order number, customer email, phone, status, or city.",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          querystring: z.object({
            search: z.string().optional(),
            status: z.string().optional(),
            cityCode: z.string().optional(),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            offset: z.coerce.number().int().min(0).default(0),
          }),
        },
      },
      async (request) => {
        return adminService.getOrders(request.query);
      }
    );

    // 5. Get Single Order Details
    protectedRoutes.get(
      "/api/v1/admin/orders/:id",
      {
        schema: {
          summary: "Get full order details with snapshots and audit history",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
        },
      },
      async (request, reply) => {
        const order = await adminService.getOrderById(request.params.id);
        if (!order) {
          return reply.status(404).send({ message: "Order not found" });
        }
        return { order };
      }
    );

    // 6. Update Order Status (Processing, Out for Delivery, Delivered, Cancelled)
    protectedRoutes.patch(
      "/api/v1/admin/orders/:id/status",
      {
        schema: {
          summary: "Update order fulfilment status",
          description:
            "Advances order state through lifecycle and schedules customer email notification via outbox.",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: UpdateOrderStatusSchema,
        },
      },
      async (request) => {
        const { id } = request.params;
        const { toStatus, reason } = request.body;
        const updated = await adminService.updateOrderStatus(
          id,
          toStatus,
          reason,
          request.admin!.id,
          webAppUrl
        );

        return {
          message: `Order status updated to '${toStatus}'`,
          order: updated,
        };
      }
    );

    // 7. Edit Pre-dispatch Delivery Address
    protectedRoutes.patch(
      "/api/v1/admin/orders/:id/address",
      {
        schema: {
          summary: "Edit customer delivery address prior to dispatch",
          description:
            "Allows modifying street address/locality before dispatch with a mandatory reason for audit history.",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: UpdateOrderAddressSchema,
        },
      },
      async (request) => {
        const { id } = request.params;
        const { reason, ...addressData } = request.body;
        const updated = await adminService.updateOrderAddress(
          id,
          addressData,
          reason,
          request.admin!.id
        );

        return {
          message: "Delivery address updated successfully",
          order: updated,
        };
      }
    );

    // 8. Process Refund Workflow
    protectedRoutes.post(
      "/api/v1/admin/orders/:id/refund",
      {
        schema: {
          summary: "Initiate payment gateway refund",
          description:
            "Approves refund and initiates Paystack refund via payment adapter.",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: RefundOrderSchema,
        },
      },
      async (request, reply) => {
        if (!opts.paymentGateway) {
          return reply.status(500).send({ message: "Payment gateway is not configured" });
        }

        const { id } = request.params;
        const { reason, approve } = request.body;

        if (!approve) {
          return reply.send({ message: "Refund request rejected by administrator" });
        }

        const result = await adminService.processRefund(
          id,
          reason,
          request.admin!.id,
          opts.paymentGateway,
          webAppUrl
        );

        return {
          message: "Refund initiated successfully",
          refund: result,
        };
      }
    );

    // 9. Create Product
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

    // 10. Edit Product
    protectedRoutes.patch(
      "/api/v1/admin/products/:id",
      {
        schema: {
          summary: "Update watch product details",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: UpdateProductSchema,
        },
      },
      async (request) => {
        const updated = await adminService.updateProduct(
          request.params.id,
          request.body
        );
        return {
          message: "Product updated successfully",
          product: updated,
        };
      }
    );

    // 11. Toggle Product Publish
    protectedRoutes.patch(
      "/api/v1/admin/products/:id/publish",
      {
        schema: {
          summary: "Publish or unpublish a watch product",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: z.object({
            isPublished: z.boolean(),
          }),
        },
      },
      async (request) => {
        const updated = await adminService.toggleProductPublish(
          request.params.id,
          request.body.isPublished
        );
        return {
          message: `Product ${request.body.isPublished ? "published" : "unpublished"} successfully`,
          product: updated,
        };
      }
    );

    // 12. Adjust Product Stock with Audit Reason
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

    // 13. Delivery Zones - List All
    protectedRoutes.get(
      "/api/v1/admin/delivery-zones",
      {
        schema: {
          summary: "List all delivery zones including inactive",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
        },
      },
      async () => {
        const zones = await adminService.getDeliveryZones();
        return { zones };
      }
    );

    // 14. Delivery Zones - Create
    protectedRoutes.post(
      "/api/v1/admin/delivery-zones",
      {
        schema: {
          summary: "Create a new delivery zone",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          body: CreateDeliveryZoneSchema,
        },
      },
      async (request, reply) => {
        const zone = await adminService.createDeliveryZone(request.body);
        return reply.status(201).send({
          message: "Delivery zone created successfully",
          zone,
        });
      }
    );

    // 15. Delivery Zones - Update
    protectedRoutes.patch(
      "/api/v1/admin/delivery-zones/:id",
      {
        schema: {
          summary: "Update delivery zone fee or status",
          tags: ["Admin"],
          security: [{ bearerAuth: [] }],
          params: z.object({
            id: z.string().uuid(),
          }),
          body: UpdateDeliveryZoneSchema,
        },
      },
      async (request) => {
        const zone = await adminService.updateDeliveryZone(
          request.params.id,
          request.body
        );
        return {
          message: "Delivery zone updated successfully",
          zone,
        };
      }
    );

    // 16. View Outbox Messages
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
