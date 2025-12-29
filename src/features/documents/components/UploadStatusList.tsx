// アップロード中のファイルステータス表示コンポーネント
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import type { UploadProgress } from "@/features/documents/hooks/useUpload";
import { Text } from "@/components/ui/Text";

export default function UploadStatusList({
  uploadProgress,
  selectedFiles,
  isUploading,
}: {
  uploadProgress: Record<string, UploadProgress>;
  selectedFiles: File[];
  isUploading: boolean;
}) {
  // isUploadingがfalseでも、uploadProgressにデータが残っていれば表示する（完了直後など）
  const hasProgress = Object.keys(uploadProgress).length > 0;
  if (!isUploading && !hasProgress) return null;

  return (
    <div className="mt-4 border-t pt-4">
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
      <div className="flex items-center justify-between mb-2">
        <Text variant="sm" color="muted" weight="semibold">
          アップロード状況
        </Text>
        {isUploading && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <Text variant="xs" color="primary" weight="medium">
              処理中...
            </Text>
          </div>
        )}
      </div>

      {/* 光るアニメーションバー (Indeterminate Progress) */}
      {isUploading && (
        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-3 relative ">
          <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-shimmer rounded-full"></div>
        </div>
      )}

      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
        {selectedFiles.map((file) => {
          const status = uploadProgress[file.name] || {
            status: "pending",
            progress: 0,
          };

          let statusIcon;
          let statusText;
          let statusColorClass = "text-muted-foreground";

          switch (status.status) {
            case "completed":
              statusIcon = (
                <CheckCircle2 className="size-4 text-success shrink-0" />
              );
              statusText = "完了";
              statusColorClass = "text-success";
              break;
            case "error":
              statusIcon = (
                <XCircle className="size-4 text-destructive shrink-0" />
              );
              statusText = "失敗";
              statusColorClass = "text-destructive";
              break;
            case "uploading":
              statusIcon = (
                <Loader2 className="size-4 animate-spin text-primary shrink-0" />
              );
              statusText = "アップロード中...";
              statusColorClass = "text-primary";
              break;
            default:
              statusIcon = (
                <div className="size-4 rounded-full border-2 border-muted shrink-0" />
              ); // 待機中の〇
              statusText = "待機中...";
              break;
          }

          return (
            <li
              key={file.name}
              className="flex items-center justify-between gap-3 p-2.5 rounded-md bg-muted/10 text-sm transition-all duration-200"
            >
              <span className="truncate font-medium flex-1 text-gray-700">
                {file.name}
              </span>
              <div
                className={`flex items-center gap-2 shrink-0 ${statusColorClass} font-medium text-xs`}
              >
                <span>{statusText}</span>
                {statusIcon}
              </div>
            </li>
          );
        })}
      </div>
    </div>
  );
}
