import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_CHAT_AGENT_URL: z.string().url().optional(),

  NEXT_PUBLIC_COGNITO_USER_POOL_ID: z.string().min(1),
  NEXT_PUBLIC_COGNITO_APP_CLIENT_ID: z.string().min(1),
  NEXT_PUBLIC_AWS_REGION: z.string().default("ap-northeast-1"),

  NEXT_PUBLIC_API_MOCKING: z.enum(["enabled", "disabled"]).default("disabled"),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_CHAT_AGENT_URL: process.env.NEXT_PUBLIC_CHAT_AGENT_URL,
  NEXT_PUBLIC_COGNITO_USER_POOL_ID:
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  NEXT_PUBLIC_COGNITO_APP_CLIENT_ID:
    process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID,
  NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
});

if (!parsed.success) {
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
