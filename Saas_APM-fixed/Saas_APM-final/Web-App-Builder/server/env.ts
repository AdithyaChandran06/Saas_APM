import { z } from "zod";

const runtimeEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_INTEGRATIONS_OPENAI_API_KEY: z.string().optional(),
  AI_INTEGRATIONS_OPENAI_BASE_URL: z.string().optional(),
  REPL_ID: z.string().optional(),
});

export function validateRuntimeEnv() {
  const parsed = runtimeEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid runtime environment: ${parsed.error.message}`);
  }

  const env = parsed.data;
  const errors: string[] = [];

  if (env.NODE_ENV === "production") {
    if (!env.DATABASE_URL) errors.push("DATABASE_URL is required in production.");
    if (!env.SESSION_SECRET) errors.push("SESSION_SECRET is required in production.");
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join("\n- ")}`);
  }

  return {
    ...env,
    openAiKey: env.AI_INTEGRATIONS_OPENAI_API_KEY || env.OPENAI_API_KEY,
  };
}
