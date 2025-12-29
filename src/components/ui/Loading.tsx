"use client";

import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

import { Text } from "./Text";
import ThreeTitleLogo from "./ThreeTitleLogo";

export default function Loading() {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center  overflow-hidden touch-none overscroll-none"
      )}
    >
      <div className="absolute inset-0 z-0 w-full h-full">
        <ThreeTitleLogo phase="SHOW_TITLE" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-end h-full pb-32 pointer-events-none">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <ShieldCheck className="w-8 h-8 text-purple-600" />
          <Text
            variant="h3"
            className="pl-8 text-slate-700 tracking-widest font-mono"
          >
            Loading...
          </Text>
        </div>
      </div>
    </div>
  );
}
