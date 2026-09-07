import { FastifyError, FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { ZodError } from "zod";

export const errorHandlerPlugin: FastifyPluginAsync = fp(
  async (fastify: FastifyInstance) => {
    fastify.setErrorHandler((error: FastifyError, request, reply) => {
      // 1. Zod Validation Error
      if (error instanceof ZodError) {
        request.log.warn({ issues: error.issues }, "Validation failed");
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "Validation failed",
          issues: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      // 2. Fastify native schema validation error
      if (error.validation) {
        request.log.warn({ validation: error.validation }, "Schema validation failed");
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: error.message,
          issues: error.validation,
        });
      }

      // 3. Known HTTP status codes
      const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;

      if (statusCode >= 500) {
        request.log.error(error, "Unhandled server error");
        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message:
            process.env.NODE_ENV === "production"
              ? "An unexpected error occurred. Please try again later."
              : error.message,
        });
      }

      request.log.info({ err: error }, "Client request error");
      return reply.status(statusCode).send({
        statusCode,
        error: error.name || "Error",
        message: error.message,
      });
    });
  },
  {
    name: "error-handler-plugin",
  }
);
