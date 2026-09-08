import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema/index.js";

export * from "./schema/index.js";
export { eq, and, or, desc, asc, sql, not, inArray, count, sum, ilike, like } from "drizzle-orm";

export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;
