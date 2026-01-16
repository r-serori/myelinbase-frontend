import {
  getDocumentStatusColor,
  getDocumentStatusLabel,
} from "@/features/documents/config/document-status";
import type { DocumentStatus } from "@/lib/api/generated/model";
import { cn } from "@/lib/utils";

// 静的なクラス名定義
// これにより Tailwind CSS がビルド時に確実にクラスを生成します
const colorStyles: Record<string, string> = {
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-muted-foreground",
  muted: "bg-muted/20 text-muted-foreground",
};

export default function StatusChip({
  status,
  className,
}: {
  status: DocumentStatus;
  className?: string;
}) {
  const label = getDocumentStatusLabel(status);
  const colorKey = getDocumentStatusColor(status);

  const styles = colorStyles[colorKey] || colorStyles.muted;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}
