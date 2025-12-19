"use client";
import { ReactNode, useState } from "react";

type TooltipProps = {
  content: string;
  children: ReactNode;
  className?: string;
};

export default function Tooltip({
  content,
  children,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  if (!content) {
    return <>{children}</>;
  }

  return (
    <div
      className={`relative inline-block ${className ?? ""}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[11px] text-white shadow-lg z-20">
          {content}
        </div>
      )}
    </div>
  );
}
