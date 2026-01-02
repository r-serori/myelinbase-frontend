import type { DocumentStatus } from "@/lib/api/generated/model";

/**
 * ステータス定義と日本語ラベルのマッピング
 */
export const DOCUMENT_STATUS_CONFIG = {
  PENDING_UPLOAD: { label: "処理中", color: "muted" },
  PROCESSING: { label: "処理中", color: "muted" },
  COMPLETED: { label: "完了", color: "success" },
  FAILED: { label: "失敗", color: "destructive" },

  DELETED: { label: "削除済", color: "muted" },
  DELETE_FAILED: { label: "削除失敗", color: "destructive" },
} as const satisfies Record<DocumentStatus, { label: string; color: string }>;

const STATUS_KEYS = Object.keys(
  DOCUMENT_STATUS_CONFIG
) as (keyof typeof DOCUMENT_STATUS_CONFIG)[];

export type DocumentStatusFilter = DocumentStatus | "ALL";

export const STATUS_FILTER_OPTIONS = [
  { value: "ALL" as const, label: "すべて", color: "muted" },
  ...STATUS_KEYS.map((key) => ({
    value: key,
    label: DOCUMENT_STATUS_CONFIG[key].label,
    color: DOCUMENT_STATUS_CONFIG[key].color,
  })).filter((option) => option.value !== "PROCESSING"),
];

/**
 * ステータスIDから日本語ラベルを取得するヘルパー
 */
export const getDocumentStatusLabel = (status: DocumentStatus): string => {
  return DOCUMENT_STATUS_CONFIG[status]?.label || status;
};

/**
 * UI表示用の統合ステータスラベルを取得するヘルパー
 * フィルター用の "ALL" にも対応
 */
export const getDocumentDisplayLabel = (
  status: DocumentStatusFilter
): string => {
  if (status === "ALL") return "すべて";
  return DOCUMENT_STATUS_CONFIG[status]?.label || status;
};

export const getDocumentStatusColor = (status: DocumentStatus): string => {
  return DOCUMENT_STATUS_CONFIG[status]?.color || "muted";
};
