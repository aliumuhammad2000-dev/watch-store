import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { CheckoutSchema } from "@hourlane/shared";
import { OrdersService } from "./orders.service.js";
import { PaymentGateway } from "../../adapters/payment/payment-gateway.interface.js";

interface OrderRoutesOptions {
  paymentGateway: PaymentGateway;
  webAppUrl: string;
}

export const orderRoutes: FastifyPluginAsync<OrderRoutesOptions> = async (
  fastify,
  options
) => {
  const ordersService = new OrdersService(
    fastify.db,
    options.paymentGateway,
    options.webAppUrl
  );
  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>();

  // 1. Guest Buy Now Checkout Initiation
  typedFastify.post(
    "/api/v1/checkout",
    {
      schema: {
        summary: "Initiate guest single-watch checkout",
        description:
          "Validates product stock and delivery zone, creates a 15-minute stock hold, creates a pending order, and initializes payment.",
        tags: ["Checkout"],
        body: CheckoutSchema,
        response: {
          201: z.object({
            orderId: z.string().uuid(),
            orderNumber: z.string(),
            totalKobo: z.number().int().positive(),
            secureStatusToken: z.string(),
            checkoutUrl: z.string().url(),
          }),
          400: z.object({
            statusCode: z.literal(400),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await ordersService.initiateCheckout(request.body);
        return reply.status(201).send(result);
      } catch (err: unknown) {
        const error = err as Error;
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: error.message || "Checkout could not be processed",
        });
      }
    }
  );

  // 2. Secure Single-Order Tracking Status
  typedFastify.get(
    "/api/v1/orders/status/:token",
    {
      schema: {
        summary: "Track order status via secure link",
        description:
          "Returns real-time status and delivery address for an order using its unguessable secure token.",
        tags: ["Orders"],
        params: z.object({
          token: z.string().min(16),
        }),
        response: {
          200: z.object({
            order: z.object({
              orderNumber: z.string(),
              status: z.string(),
              productName: z.string(),
              brand: z.string(),
              sku: z.string(),
              unitPriceKobo: z.number(),
              deliveryCity: z.string(),
              deliveryFeeKobo: z.number(),
              totalKobo: z.number(),
              streetAddress: z.string(),
              areaLocality: z.string(),
              customerName: z.string(),
              createdAt: z.date().or(z.string()),
              updatedAt: z.date().or(z.string()),
            }),
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
      const { token } = request.params;
      const order = await ordersService.getOrderBySecureToken(token);

      if (!order) {
        return reply.status(404).send({
          statusCode: 404,
          error: "Not Found",
          message: "Order not found or link has expired.",
        });
      }

      return { order };
    }
  );

  // 3. Paystack Payment Webhook Listener
  fastify.post(
    "/api/v1/webhooks/paystack",
    {
      schema: {
        summary: "Paystack payment webhook receiver",
        tags: ["Payments"],
      },
    },
    async (request, reply) => {
      const signature = request.headers["x-paystack-signature"] as string;

      if (!signature) {
        request.log.warn("Paystack webhook received without signature");
        return reply.status(400).send({ error: "Missing signature" });
      }

      const verifiedEvent = await options.paymentGateway.verifyWebhook(
        JSON.stringify(request.body),
        signature
      );

      if (!verifiedEvent) {
        request.log.warn("Invalid Paystack webhook signature rejected");
        return reply.status(401).send({ error: "Invalid signature" });
      }

      request.log.info(
        { event: verifiedEvent.event, reference: verifiedEvent.reference },
        "Processing verified Paystack payment event"
      );

      if (verifiedEvent.event === "charge.success") {
        await ordersService.handlePaymentWebhookSuccess(
          verifiedEvent.reference,
          verifiedEvent.channel,
          verifiedEvent.paidAt
        );
      }

      return reply.status(200).send({ received: true });
    }
  );
};
