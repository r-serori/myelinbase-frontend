import { z } from "zod";

const envSchema = z.object({
  // Public variables (exposed to the browser)
  NEXT_PUBLIC_API_BASE_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_API_MOCKING: z.enum(["enabled", "disabled"]).default("disabled"),

  // Server-side variables (optional example)
  // NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Process environment variables
// Note: In Next.js, process.env is populated at build time for public vars
const _env = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
});

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
