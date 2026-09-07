import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { createDb, type Database } from "@hourlane/db";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

interface DbPluginOptions {
  databaseUrl: string;
}

export const dbPlugin = fp(
  async (fastify: FastifyInstance, options: DbPluginOptions) => {
    const db = createDb(options.databaseUrl);
    fastify.decorate("db", db);
  },
  {
    name: "db-plugin",
  }
);
