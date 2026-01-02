"use client";

import { useEffect, useState } from "react";

import { env } from "@/lib/env";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (env.NEXT_PUBLIC_API_MOCKING === "enabled") {
        const { worker } = await import("../mocks/browser");
        await worker.start({
          onUnhandledRequest: "bypass",
        });
      }
      setMswReady(true);
    };

    init();
  }, []);

  if (!mswReady) {
    return null;
  }

  return <>{children}</>;
}
