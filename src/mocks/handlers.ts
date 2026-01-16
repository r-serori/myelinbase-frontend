import { http, HttpResponse } from "msw";

import { env } from "@/lib/env";

const baseUrl = env.NEXT_PUBLIC_API_BASE_URL;

export const handlers = [
  // Example: User Profile Handler
  http.get(`${baseUrl}/auth/me`, () => {
    return HttpResponse.json({
      id: "mock-user-id",
      email: "mock@example.com",
      name: "Mock User",
    });
  }),

  // Example: Chat List Handler
  http.get(`${baseUrl}/chat/sessions`, () => {
    return HttpResponse.json({
      sessions: [
        {
          sessionId: "session-1",
          sessionName: "Mock Session 1",
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        },
        {
          sessionId: "session-2",
          sessionName: "Mock Session 2",
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        },
      ],
    });
  }),

  // Example: Health Check
  http.get(`${baseUrl}/health`, () => {
    return HttpResponse.json({ status: "ok" });
  }),
];
