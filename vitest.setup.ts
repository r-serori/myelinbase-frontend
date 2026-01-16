import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll } from "vitest";

import "@testing-library/jest-dom";

beforeAll(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:3000";
  process.env.NEXT_PUBLIC_CHAT_AGENT_URL = "http://localhost:3000/chat";
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = "test-user-pool-id";
  process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID = "test-app-client-id";
  process.env.NEXT_PUBLIC_AWS_REGION = "ap-northeast-1";
  process.env.NEXT_PUBLIC_API_MOCKING = "enabled";
});

afterEach(() => {
  cleanup();
});
