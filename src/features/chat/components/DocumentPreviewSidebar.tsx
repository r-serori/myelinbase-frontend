import React from "react";
import { ExternalLink, FileText, X } from "lucide-react";

import { useGetDocumentDownloadUrl } from "@/features/documents/hooks/useDocuments";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { ErrorResponse, SourceDocument } from "@/lib/api/generated/model";
import { getErrorMessage } from "@/lib/error-mapping";

import { useToast } from "@/providers/ToastProvider";

type DocumentPreviewSidebarProps = {
  document: SourceDocument | null;
  onClose: () => void;
  isOpen: boolean;
};

export default function DocumentPreviewSidebar({
  document,
  onClose,
  isOpen,
}: DocumentPreviewSidebarProps) {
  const { showToast } = useToast();
  const getDownloadUrl = useGetDocumentDownloadUrl();

  const handleDownload = async () => {
    if (!document?.documentId) return;

    try {
      const { downloadUrl } = await getDownloadUrl.mutateAsync(
        document.documentId
      );

      let targetUrl = downloadUrl;
      if (targetUrl.includes("localstack")) {
        targetUrl = targetUrl.replace("localstack", "localhost");
      }

      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      showToast({
        type: "error",
        message: getErrorMessage((err as ErrorResponse).errorCode),
      });
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-border bg-secondary">
        <div className="flex items-center gap-2 overflow-auto">
          <FileText className="size-5 text-foreground flex-shrink-0" />
          <Text variant="md" weight="semibold" className="truncate">
            {document.fileName}
          </Text>
        </div>
        <div className="flex items-center gap-1">
          <Text variant="xs" color="muted" as="span" className="truncate">
            一部を表示しています
          </Text>
          <Button variant="close" size="close" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 bg-background">
        <Text
          variant="md"
          className="whitespace-pre-wrap leading-relaxed font-mono text-foreground"
        >
          {document.text || "プレビューが表示できません"}
        </Text>
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-border bg-background flex items-center justify-end">
        <Button onClick={handleDownload} className="gap-2" size="sm">
          <ExternalLink className="size-4" />
          元のファイルを開く
        </Button>
      </div>
    </div>
  );
}
