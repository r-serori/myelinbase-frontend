"use client";
import { ReactNode, useState } from "react";

type ChatTooltipProps = {
  content: string;
  children: ReactNode;
  className?: string;
  position?: "bottom" | "bottom-right";
};

export default function ChatTooltip({
  content,
  children,
  className,
  position = "bottom",
}: ChatTooltipProps) {
  const [visible, setVisible] = useState(false);

  if (!content) {
    return <>{children}</>;
  }

  const positionClass =
    position === "bottom"
      ? "top-full left-1/2 mt-2 -translate-x-1/2"
      : "top-full left-0 mt-2";

  return (
    <div
      className={`relative ${className ?? ""}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute ${positionClass} whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-secondary shadow-lg z-60`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
