"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

export default function ChatLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  return <div className="h-screen">{children}</div>;
}
