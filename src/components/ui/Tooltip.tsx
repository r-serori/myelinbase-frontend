import { cn } from "@/lib/utils";
import { CircleQuestionMark } from "lucide-react";
import { useState } from "react";
import Alert from "./Alert";
import type { AlertColor } from "./Alert";

function Tooltip({
  children,
  circleSize = 6,
  position,
  color = "default",
}: {
  children: React.ReactNode;
  circleSize?: number;
  position: string;
  color?: AlertColor;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleTooltipClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setShowTooltip(!showTooltip);
  };
  return (
    <>
      <button
        className="cursor-pointer block rounded-full p-1 relative"
        onClick={handleTooltipClick}
      >
        <CircleQuestionMark
          className={cn(
            `size-${circleSize}`,
            "text-primary hover:text-primary/60"
          )}
        />
      </button>
      {showTooltip && (
        <div
          className={cn(
            "absolute z-70 bg-background text-foreground border border-border rounded-md p-2 shadow-md",
            position
          )}
        >
          {children}
        </div>
      )}
    </>
  );
}

export default Tooltip;
