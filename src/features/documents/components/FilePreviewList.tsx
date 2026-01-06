import { AlertTriangle, File as FileIcon, FileText, X } from "lucide-react";

import Alert from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

type BasePreview = {
  name: string;
  size: number;
  mime: string;
  isDuplicate?: boolean;
  duplicateOf?: string | null;
};

export type Preview =
  | (BasePreview & { kind: "text"; snippet: string })
  | (BasePreview & { kind: "pdf"; url: string });

type FilePreviewListProps = {
  previews: Preview[];
  onRemove: (name: string) => void;
  onPreviewClick: (preview: Preview) => void;
  selectedFilesCount: number;
  duplicateCount?: number;
};

export default function FilePreviewList({
  previews,
  onRemove,
  onPreviewClick,
  selectedFilesCount,
  duplicateCount = 0,
}: FilePreviewListProps) {
  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between">
        <Text variant="md" color="muted">
          選択中のファイル ({selectedFilesCount})
        </Text>
        {duplicateCount > 0 && (
          <Text
            variant="sm"
            color="warning"
            className="flex items-center gap-1"
          >
            <AlertTriangle className="size-3.5" />
            {duplicateCount}件の重複
          </Text>
        )}
      </div>

      {duplicateCount > 0 && (
        <Alert color="warning">
          <Text variant="sm" color="warning">
            同じ内容のファイルがあります。重複ファイルはアップロード時に自動で除外されます。
          </Text>
        </Alert>
      )}

      <ul className="space-y-2 max-h-40 sm:max-h-65 overflow-y-auto mt-3">
        {previews.map((p) => {
          const isDuplicate = p.isDuplicate ?? false;

          return (
            <li
              key={p.name}
              className={`
                flex items-center gap-3 p-1 rounded-md border transition-colors relative cursor-pointer
                ${
                  isDuplicate
                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 opacity-60"
                    : "bg-muted/10 hover:bg-accent border-border"
                }
              `}
              onClick={() => onPreviewClick(p)}
            >
              <div
                className={`
                  shrink-0 size-6 flex items-center justify-center rounded border
                  ${
                    isDuplicate
                      ? "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400"
                      : "bg-background text-muted-foreground/80"
                  }
                `}
              >
                {isDuplicate ? (
                  <AlertTriangle className="size-4" />
                ) : p.kind === "text" ? (
                  <FileText className="size-4" />
                ) : (
                  <FileIcon className="size-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <div className="w-full flex flex-col">
                    <div className="flex items-center justify-between">
                      <Text
                        variant="md"
                        onClick={() => onPreviewClick(p)}
                        title="プレビューを表示"
                        className={isDuplicate ? "line-through" : ""}
                      >
                        {p.name}
                      </Text>
                      <Text variant="sm" color="muted" as="span">
                        {(p.size / 1024).toFixed(1)} KB
                      </Text>
                    </div>
                    {isDuplicate && p.duplicateOf && (
                      <Text variant="sm" color="warning">
                        「{p.duplicateOf}」と同じ内容
                      </Text>
                    )}
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
