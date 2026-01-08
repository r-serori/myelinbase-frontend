import Image from "next/image";

import { cn } from "@/lib/utils";

interface LightLoadingProps {
  text?: string;
  showIcon?: boolean;
  className?: string;
}

export default function LightLoading({
  text = "Loading...",
  showIcon = true,
  className,
}: LightLoadingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && (
        <Image
          src="/images/icon.png"
          alt="Myelin Base Logo"
          width={32}
          height={32}
          className="object-contain"
        />
      )}
      <span className="text-xl font-semibold pl-1 thinking-text-muted">
        {text}
      </span>
    </div>
  );
}
