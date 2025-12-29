"use client";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { registerZodErrorMap } from "@/lib/zod-error-map";

registerZodErrorMap();

const client = new QueryClient();

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
