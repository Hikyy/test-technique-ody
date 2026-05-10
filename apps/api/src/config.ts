import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  PG_HOST: z.string().default("localhost"),
  PG_PORT: z.coerce.number().int().positive().default(5435),
  PG_USER: z.string().default("ody"),
  PG_PASS: z.string().default("ody"),
  PG_DB: z.string().default("ody"),
  DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().min(16),
  AUTH_URL: z.string().url().default("http://localhost:3001"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((s) =>
      s
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    ),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  STORAGE_DIR: z.string().default("storage"),
  STORAGE_PUBLIC_PATH: z.string().default("/storage"),
  UPLOAD_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(2 * 1024 * 1024),
  MAIL_HOST: z.string().default("localhost"),
  MAIL_PORT: z.coerce.number().int().positive().default(1025),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("Sève <noreply@seve.local>"),
  MAIL_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  WEB_URL: z.string().url().default("http://localhost:3000"),
  COOKIE_DOMAIN: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

const parsed = ConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config: AppConfig = parsed.data;
export const isProd = config.NODE_ENV === "production";
export const isDev = config.NODE_ENV === "development";
