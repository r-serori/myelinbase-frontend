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
          onUnhandledRequest: "bypass", // モックされていないリクエストはそのまま通す
        });
        console.log("[MSW] Mocking enabled");
      }
      setMswReady(true);
    };

    init();
  }, []);

  if (!mswReady) {
    // MSWの初期化を待つ間、何も表示しない
    // これにより、初期化前のリクエストがモックされずに飛ぶのを防ぐ
    return null;
  }

  return <>{children}</>;
}
