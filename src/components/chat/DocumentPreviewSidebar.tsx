import React from "react";
import { SourceDocument } from "@/lib/schemas/chat";
import { X, FileText, ExternalLink } from "lucide-react";
import { Button } from "../ui/Button";
import { Text } from "../ui/Text";
import { useGetDocumentDownloadUrl } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";

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
  const getDownloadUrl = useGetDocumentDownloadUrl();

  const handleDownload = async () => {
    if (!document?.documentId) return;

    try {
      const { downloadUrl } = await getDownloadUrl.mutateAsync(
        document.documentId
      );
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error("Failed to get download URL", e);
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
