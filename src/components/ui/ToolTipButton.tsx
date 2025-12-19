import { ComponentType, useState } from "react";
import { useEffect } from "react";
import Tooltip from "./Tooltip";
import Button from "./Button";

type ToolTipButtonProps = {
  content: string;
  onClick: () => void;
  Icon: ComponentType<{ className?: string }>;
  active?: boolean;
  variant?: "good" | "bad";
};

export default function ToolTipButton({
  content,
  onClick,
  Icon,
  active,
  variant,
}: ToolTipButtonProps) {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    onClick();
  };

  useEffect(() => {
    if (!clicked) return;
    const timer = setTimeout(() => setClicked(false), 220);
    return () => clearTimeout(timer);
  }, [clicked]);

  return (
    <Tooltip content={content}>
      <button
        className={`tooltip-button text-[11px] rounded-full p-2 hover:bg-gray-200 ${
          clicked ? "tooltip-button-clicked" : ""
        }`}
        onClick={handleClick}
      >
        <Icon
          className={`w-4 h-4 tooltip-icon ${
            active
              ? `text-blue-600 ${
                  variant === "good" ? "icon-bounce-up" : "icon-bounce-down"
                }`
              : "text-gray-600"
          } ${clicked ? "tooltip-icon-clicked" : ""}`}
        />
      </button>
    </Tooltip>
  );
}
