import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    alias: {
      "@": resolve(__dirname, "./src"),
    },
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:3000",
      NEXT_PUBLIC_CHAT_AGENT_URL: "http://localhost:3000/chat",
      NEXT_PUBLIC_COGNITO_USER_POOL_ID: "test-user-pool-id",
      NEXT_PUBLIC_COGNITO_APP_CLIENT_ID: "test-app-client-id",
      NEXT_PUBLIC_AWS_REGION: "ap-northeast-1",
      NEXT_PUBLIC_API_MOCKING: "enabled",
    },
  },
});
