import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTooltipClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTooltip(!showTooltip);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    }

    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        className="cursor-pointer inline-block rounded-full p-1 transition-opacity hover:opacity-80 focus:outline-none"
        onClick={handleTooltipClick}
      >
        <CircleQuestionMark
          className={cn(
            `size-${circleSize}`,
            `text-primary ${showTooltip ? "text-primary/60" : ""}`
          )}
        />
      </button>
      {showTooltip && (
        <div
          className={cn(
            "absolute z-50 bg-background text-foreground border border-border rounded-md p-3 shadow-md w-max max-w-sm",
            position
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="close"
            size="close"
            onClick={() => setShowTooltip(false)}
            aria-label="ツールチップを閉じる"
            className="absolute top-1 right-1 z-10"
          >
            <X className="size-3" />
          </Button>

          <div className="pr-6 pt-1">{children}</div>
        </div>
      )}
    </div>
  );
}

export default Tooltip;
