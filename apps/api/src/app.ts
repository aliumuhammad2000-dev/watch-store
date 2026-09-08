import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";
import { loadEnv, type Env } from "./config/env.js";
import { dbPlugin } from "./plugins/db.js";
import { errorHandlerPlugin } from "./plugins/error-handler.js";
import { authPlugin } from "./plugins/auth.js";
import { ClerkIdentityProvider } from "./adapters/identity/clerk-identity-provider.js";
import { MockIdentityProvider } from "./adapters/identity/mock-identity-provider.js";
import { deliveryRoutes } from "./modules/delivery/delivery.routes.js";
import { catalogRoutes } from "./modules/catalog/catalog.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { orderRoutes } from "./modules/orders/orders.routes.js";
import { PaystackPaymentGateway } from "./adapters/payment/paystack-payment-gateway.js";
import { MockPaymentGateway } from "./adapters/payment/mock-payment-gateway.js";
import { ResendEmailSender } from "./adapters/email/resend-email-sender.js";
import { MockEmailSender } from "./adapters/email/mock-email-sender.js";
import { OutboxWorker } from "./workers/outbox-worker.js";

export async function buildApp(customEnv?: Env) {
  const env = customEnv || loadEnv();

  const app = Fastify({
    logger: {
      transport:
        env.NODE_ENV !== "production"
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
              },
            }
          : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>();

  // 1. Zod compilers
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // 2. Global Error Handler
  await app.register(errorHandlerPlugin);

  // 3. Security & CORS
  await app.register(cors, {
    origin: env.WEB_APP_URL || true,
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === "production",
  });

  // 4. OpenAPI / Swagger Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Hourlane Watches API",
        description: "RESTful API for Hourlane Watches e-commerce platform",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://${env.HOST}:${env.PORT}`,
          description: "API server",
        },
      ],
      tags: [
        { name: "System", description: "Health and diagnostics" },
        { name: "Catalog", description: "Public watch catalog and product details" },
        { name: "Delivery", description: "City delivery zones and fixed fees" },
        { name: "Admin", description: "Protected store administrator operations" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Clerk Session Token (or 'dev-admin-token' in development)",
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });

  // 5. Database Connection (Neon PostgreSQL)
  await app.register(dbPlugin, {
    databaseUrl: env.DATABASE_URL,
  });

  // 6. Identity Provider (Clerk in live/production, Mock in dev if keys absent)
  const identityProvider =
    env.CLERK_SECRET_KEY && !env.CLERK_SECRET_KEY.startsWith("sk_test_...")
      ? new ClerkIdentityProvider(env.CLERK_SECRET_KEY, env.CLERK_PUBLISHABLE_KEY)
      : new MockIdentityProvider();

  await app.register(authPlugin, {
    identityProvider,
  });

  // 7. System Routes
  app.get(
    "/health",
    {
      schema: {
        summary: "Service health check",
        description: "Returns health status of the API service",
        tags: ["System"],
        response: {
          200: z.object({
            status: z.literal("ok"),
            timestamp: z.string(),
            uptimeSeconds: z.number(),
          }),
        },
      },
    },
    async () => {
      return {
        status: "ok" as const,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
      };
    }
  );

  // 8. Payment Gateway Adapter (Paystack in production/live, Mock in development if keys not set)
  const paymentGateway =
    env.PAYSTACK_SECRET_KEY && !env.PAYSTACK_SECRET_KEY.startsWith("sk_test_...")
      ? new PaystackPaymentGateway(
          env.PAYSTACK_SECRET_KEY,
          env.PAYSTACK_WEBHOOK_SECRET || ""
        )
      : new MockPaymentGateway(env.WEB_APP_URL);

  // 9. Business Modules
  await app.register(deliveryRoutes);
  await app.register(catalogRoutes);
  await app.register(adminRoutes, {
    paymentGateway,
    webAppUrl: env.WEB_APP_URL,
  });
  await app.register(orderRoutes, {
    paymentGateway,
    webAppUrl: env.WEB_APP_URL,
  });

  // 10. Transactional Email & PostgreSQL Outbox Worker
  const isRealResendKey =
    Boolean(env.RESEND_API_KEY) &&
    !env.RESEND_API_KEY?.includes("...") &&
    (env.RESEND_API_KEY?.length ?? 0) > 20;

  const emailSender = isRealResendKey
    ? new ResendEmailSender(env.RESEND_API_KEY!, env.EMAIL_FROM_ADDRESS)
    : new MockEmailSender();

  const outboxWorker = new OutboxWorker(app.db, emailSender, env.WEB_APP_URL);
  outboxWorker.start(5000);

  app.addHook("onClose", () => {
    outboxWorker.stop();
  });

  return app;
}

