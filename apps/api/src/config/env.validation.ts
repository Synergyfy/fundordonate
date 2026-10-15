import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5024),
  CORS_ORIGIN: z.string().default("http://localhost:5023"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional().or(z.literal("")),
  REDIS_DB: z.coerce.number().int().min(0).default(0),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  TOKEN_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex characters)"),

  // ── MCOM Solutions Central Hub ──
  MCOM_SOLUTIONS_URL: z.string().url().default("http://localhost:3010"),
  MCOM_CLIENT_ID: z.string().min(1, "MCOM_CLIENT_ID is required"),
  MCOM_CLIENT_SECRET: z.string().min(1, "MCOM_CLIENT_SECRET is required"),
  MCOM_API_KEY: z.string().optional(),
  MCOM_SOLUTION_API_KEY: z.string().optional(),
  MCOM_HMAC_SECRET: z.string().optional(),
  MCOM_WEBHOOK_SECRET: z.string().optional(),
  MCOM_PLATFORM_SLUG: z.string().default("fundordonate"),
  MCOM_REDIRECT_URI: z.string().url("MCOM_REDIRECT_URI must be a valid URL"),
  MCOM_SCOPES: z.string().default("profile email business membership packages"),
  SSO_SECRET: z.string().optional().or(z.literal("")),

  MCOM_SERVICE_ENABLED: z
    .enum(["true", "false"])
    .default("false"),
  MCOM_SERVICE_BASE_URL: z.string().optional(),
  MCOM_SERVICE_SCOPES: z.string().optional(),

  // ── Ecosystem peer: MCOM Rewards (direct app-to-app) ──
  MCOM_REWARDS_BASE_URL: z.string().url().default("http://localhost:4000"),
  MCOM_REWARDS_AUDIENCE: z.string().default("mcom-rewards"),
  MCOM_REWARDS_FUNDORDONATE_WEBHOOK_SECRET: z.string().optional(),

  // ── Reward reconciliation safety net ──
  REWARDS_RECONCILE_ENABLED: z.enum(["true", "false"]).default("true"),
  REWARDS_RECONCILE_INTERVAL_MS: z.coerce.number().int().positive().default(900000),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates process.env on boot. Throws a readable error listing every
 * missing/invalid variable instead of failing later at runtime.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${details}`);
  }

  return parsed.data;
}
