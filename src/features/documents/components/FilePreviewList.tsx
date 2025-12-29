import { File as FileIcon, FileText, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export type Preview =
  | { kind: "text"; name: string; size: number; mime: string; snippet: string }
  | { kind: "pdf"; name: string; size: number; mime: string; url: string };

type FilePreviewListProps = {
  previews: Preview[];
  onRemove: (name: string) => void;
  onPreviewClick: (preview: Preview) => void;
  selectedFilesCount: number;
};

export default function FilePreviewList({
  previews,
  onRemove,
  onPreviewClick,
  selectedFilesCount,
}: FilePreviewListProps) {
  return (
    <div className="border-t pt-4">
      <Text variant="md" color="muted">
        選択中のファイル ({selectedFilesCount})
      </Text>

      <ul className="space-y-2 max-h-40 sm:max-h-65 overflow-y-auto mt-3">
        {previews.map((p) => {
          return (
            <li
              key={p.name}
              className="flex items-center gap-3 p-1 rounded-md border bg-muted/10 hover:bg-accent transition-colors relative cursor-pointer"
              onClick={() => onPreviewClick(p)}
            >
              <div className="shrink-0 size-6 flex items-center justify-center bg-background rounded border text-muted-foreground/80">
                {p.kind === "text" ? (
                  <FileText className="size-4" />
                ) : (
                  <FileIcon className="size-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <div className="w-full flex items-center justify-between">
                    <Text
                      variant="md"
                      onClick={() => onPreviewClick(p)}
                      title="プレビューを表示"
                    >
                      {p.name}
                    </Text>
                    <Text variant="sm" color="muted" as="span">
                      {(p.size / 1024).toFixed(1)} KB
                    </Text>
                  </div>
                  <Button
                    variant="close"
                    type="button"
                    size="close"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(p.name);
                    }}
                    className="hover:bg-destructive/20 hover:text-destructive cursor-pointer"
                    title="削除"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
