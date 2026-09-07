import { z } from "zod";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  WEB_APP_URL: z.string().default("http://localhost:5173"),

  // Optional during initial dev / mocked in test mode
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().default("orders@hourlane.com"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.format());
    throw new Error("Invalid environment variables");
  }
  return result.data;
}
