import {
  AlertTriangle,
  CheckCircle2,
  File as FileIcon,
  FileText,
  Loader2,
  X,
  XCircle,
} from "lucide-react";

import type { UploadProgress } from "@/features/documents/hooks/useUpload";
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
  // アップロード関連（統合版）
  uploadProgress?: Record<string, UploadProgress>;
  isUploading?: boolean;
  onClearAll?: () => void;
};

// ステータスに応じたアイコンとテキストを返すヘルパー
function getStatusDisplay(
  status: UploadProgress["status"],
  errorCode?: string
) {
  switch (status) {
    case "completed":
      return {
        icon: <CheckCircle2 className="size-4 text-success shrink-0" />,
        text: "完了",
        colorClass: "text-success",
      };
    case "error":
      return {
        icon: <XCircle className="size-4 text-destructive shrink-0" />,
        text:
          errorCode === "DOCUMENTS_DUPLICATE_CONTENT" ||
          errorCode === "DOCUMENTS_DUPLICATE_IN_SELECTION"
            ? "重複"
            : "失敗",
        colorClass: "text-destructive",
      };
    case "uploading":
      return {
        icon: <Loader2 className="size-4 animate-spin text-primary shrink-0" />,
        text: "処理中",
        colorClass: "text-primary",
      };
    default:
      return {
        icon: (
          <div className="size-4 rounded-full border-2 border-muted shrink-0" />
        ),
        text: "待機中",
        colorClass: "text-muted-foreground",
      };
  }
}

export default function FilePreviewList({
  previews,
  onRemove,
  onPreviewClick,
  selectedFilesCount,
  duplicateCount = 0,
  uploadProgress = {},
  isUploading = false,
  onClearAll,
}: FilePreviewListProps) {
  const hasProgress = Object.keys(uploadProgress).length > 0;
  const hasErrors = Object.values(uploadProgress).some(
    (p) => p.status === "error"
  );
  const isUploadComplete = hasProgress && !isUploading;
  const showClearButton = isUploadComplete && hasErrors && onClearAll;

  // アップロード完了後は、フロントエンド重複（最初から除外されたファイル）を非表示
  // これらのファイルはアップロード対象外だったので、表示しても混乱を招くだけ
  const displayPreviews = hasProgress
    ? previews.filter((p) => !p.isDuplicate)
    : previews;

  // 表示するファイル数（アップロード完了後はフロントエンド重複を除外した数）
  const displayCount = hasProgress
    ? selectedFilesCount - duplicateCount
    : selectedFilesCount;

  return (
    <div className="border-t pt-4">
      {/* shimmerアニメーション（アップロード中） */}
      {isUploading && (
        <>
          <style jsx>{`
            @keyframes shimmer {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(300%);
              }
            }
            .animate-shimmer {
              animation: shimmer 1.5s infinite linear;
            }
          `}</style>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-3 relative">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-shimmer rounded-full"></div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Text variant="md" color="muted">
            {hasProgress ? "アップロード状況" : "選択中のファイル"} (
            {displayCount})
          </Text>
          {isUploading && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <Text variant="xs" color="primary" weight="medium">
                処理中...
              </Text>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {duplicateCount > 0 && !hasProgress && (
            <Text
              variant="sm"
              color="warning"
              className="flex items-center gap-1"
            >
              <AlertTriangle className="size-3.5" />
              {duplicateCount}件の重複
            </Text>
          )}
          {showClearButton && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={onClearAll}
            >
              全てクリア
            </Button>
          )}
        </div>
      </div>

      {duplicateCount > 0 && !hasProgress && (
        <Alert color="warning">
          <Text variant="sm" color="warning">
            同じ内容のファイルがあります。重複ファイルはアップロード時に自動で除外されます。
          </Text>
        </Alert>
      )}

      <ul className="space-y-2 max-h-40 sm:max-h-65 overflow-y-auto mt-3">
        {displayPreviews.map((p) => {
          const isDuplicate = p.isDuplicate ?? false;
          const progress = uploadProgress[p.name];
          const uploadStatus = progress?.status;
          const isCompleted = uploadStatus === "completed";
          const isError = uploadStatus === "error";
          const statusDisplay = progress
            ? getStatusDisplay(progress.status, progress.errorCode)
            : null;

          // 削除ボタンの有効/無効判定
          // - アップロード中は無効
          // - 完了したファイルは無効
          // - エラーファイルは有効（再選択のため削除可能）
          const canRemove = !isUploading && !isCompleted;

          return (
            <li
              key={p.name}
              className={`
                flex items-center gap-3 p-1 rounded-md border transition-all duration-200 relative
                ${isCompleted ? "opacity-60" : ""}
                ${
                  isDuplicate
                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 opacity-60"
                    : isError
                      ? "bg-destructive/5 border-destructive/30"
                      : "bg-muted/10 hover:bg-accent border-border cursor-pointer"
                }
              `}
              onClick={() => !isCompleted && onPreviewClick(p)}
            >
              <div
                className={`
                  shrink-0 size-6 flex items-center justify-center rounded border
                  ${
                    isDuplicate
                      ? "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400"
                      : isError
                        ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : isCompleted
                          ? "bg-success/10 border-success/30 text-success"
                          : "bg-background text-muted-foreground/80"
                  }
                `}
              >
                {isDuplicate ? (
                  <AlertTriangle className="size-4" />
                ) : statusDisplay ? (
                  statusDisplay.icon
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
                        title={isCompleted ? undefined : "プレビューを表示"}
                        className={`${isDuplicate || isCompleted ? "line-through" : ""} ${isError ? "text-destructive" : ""}`}
                      >
                        {p.name}
                      </Text>
                      <div className="flex items-center gap-2">
                        {statusDisplay ? (
                          <Text
                            variant="sm"
                            weight="medium"
                            className={`${statusDisplay.colorClass} flex items-center gap-1`}
                          >
                            {statusDisplay.text}
                          </Text>
                        ) : (
                          <Text variant="sm" color="muted" as="span">
                            {(p.size / 1024).toFixed(1)} KB
                          </Text>
                        )}
                      </div>
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
                      if (canRemove) onRemove(p.name);
                    }}
                    disabled={!canRemove}
                    className={`${canRemove ? "hover:bg-destructive/20 hover:text-destructive cursor-pointer" : "opacity-30 cursor-not-allowed"}`}
                    title={
                      canRemove ? "削除" : isCompleted ? "完了済み" : "処理中"
                    }
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
