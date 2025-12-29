import { ComponentType, useState } from "react";
import { useEffect } from "react";

import ChatTooltip from "@/features/chat/components/ChatTooltip";
import { Button } from "@/components/ui/Button";

type ChatToolTipButtonProps = {
  content: string;
  onClick: () => void;
  Icon: ComponentType<{ className?: string }>;
  active?: boolean;
  variant?: "good" | "bad";
};

export default function ChatToolTipButton({
  content,
  onClick,
  Icon,
  active,
  variant,
}: ChatToolTipButtonProps) {
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
    <ChatTooltip content={content}>
      <Button
        variant="close"
        size="icon"
        className={`tooltip-button ${clicked && "tooltip-button-clicked"}`}
        onClick={handleClick}
      >
        <Icon
          className={`size-4 tooltip-icon ${
            active
              ? `text-primary ${
                  variant === "good" ? "icon-bounce-up" : "icon-bounce-down"
                }`
              : "text-muted-foreground"
          } ${clicked && "tooltip-icon-clicked"}`}
        />
      </Button>
    </ChatTooltip>
  );
}
