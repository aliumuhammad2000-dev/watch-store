import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { eq, or } from "@hourlane/db";
import { admins } from "@hourlane/db";
import { IdentityProvider } from "../adapters/identity/identity-provider.interface.js";

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  clerkUserId: string;
}

declare module "fastify" {
  interface FastifyRequest {
    admin?: AdminPayload;
  }
  interface FastifyInstance {
    authenticateAdmin: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

interface AuthPluginOptions {
  identityProvider: IdentityProvider;
}

export const authPlugin = fp(
  async (fastify: FastifyInstance, options: AuthPluginOptions) => {
    fastify.decorate(
      "authenticateAdmin",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return reply.status(401).send({
            statusCode: 401,
            error: "Unauthorized",
            message: "Missing or invalid Authorization header",
          });
        }

        const token = authHeader.substring("Bearer ".length).trim();
        const user = await options.identityProvider.verifySessionToken(token);

        if (!user) {
          return reply.status(401).send({
            statusCode: 401,
            error: "Unauthorized",
            message: "Invalid or expired session token",
          });
        }

        // Match against admins table in Neon database
        const matchingAdmins = await fastify.db
          .select()
          .from(admins)
          .where(or(eq(admins.clerkUserId, user.userId), eq(admins.email, user.email)))
          .limit(1);

        const admin = matchingAdmins[0];

        if (!admin || !admin.isActive) {
          request.log.warn(
            { email: user.email, userId: user.userId },
            "Unauthorized access attempt to admin area"
          );
          return reply.status(403).send({
            statusCode: 403,
            error: "Forbidden",
            message: "Access restricted to authorized administrators",
          });
        }

        // Sync clerkUserId if this is the first login by email
        if (admin.clerkUserId !== user.userId) {
          await fastify.db
            .update(admins)
            .set({ clerkUserId: user.userId, updatedAt: new Date() })
            .where(eq(admins.id, admin.id));
        }

        request.admin = {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          clerkUserId: user.userId,
        };
      }
    );
  },
  {
    name: "auth-plugin",
    dependencies: ["db-plugin"],
  }
);
