import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface TagChipProps {
  isDeleted?: boolean;
  tag: string;
  onClick?: (tag: string) => void;
}

export default function TagChip({
  isDeleted = false,
  tag,
  onClick,
}: TagChipProps) {
  if (isDeleted) {
    return (
      <div
        aria-label={`タグ: ${tag}`}
        title={tag}
        className="flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 h-5 px-1.5 py-0.5 text-xs"
      >
        {tag}
        <Button
          variant="close"
          size="iconSmall"
          className="p-0.5 text-gray-400 hover:bg-red-200 hover:text-red-700"
          onClick={() => onClick?.(tag)}
          title="タグを削除"
        >
          <X className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      aria-label={`タグ: ${tag}`}
      variant="tag"
      size="xxs"
      title={tag}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(tag);
      }}
    >
      {tag}
    </Button>
  );
}
