import { useState } from "react";
import { CircleQuestionMark, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "./Button";

function Tooltip({
  children,
  circleSize = 6,
  position,
}: {
  children: React.ReactNode;
  circleSize?: number;
  position: string;
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
            `text-primary ${showTooltip ? "text-primary/60" : "hover:text-primary/60"}`
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
          <Button
            variant="iconSmall"
            size="iconSmall"
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-3 cursor-pointer"
          >
            <X className="size-4" />
          </Button>
          {children}
        </div>
      )}
    </>
  );
}

export default Tooltip;
