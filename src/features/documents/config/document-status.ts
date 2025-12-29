import type { DocumentStatus } from "@/lib/api/generated/model";

// =================================================================
// UI用の設定（生成された型定義とは別に管理）
// =================================================================

/**
 * ステータス定義と日本語ラベルのマッピング
 * ユーザーが状態を区別しやすいよう、ラベルを一意に修正しました。
 */
export const DOCUMENT_STATUS_CONFIG = {
  // 正常フロー
  PENDING_UPLOAD: { label: "処理中", color: "muted" }, // アップロード待ち
  PROCESSING: { label: "処理中", color: "muted" }, // AI処理中・インデックス作成中
  COMPLETED: { label: "完了", color: "success" }, // 検索可能

  // エラー系
  FAILED: { label: "失敗", color: "destructive" },

  DELETED: { label: "削除済", color: "muted" },
  DELETE_FAILED: { label: "削除失敗", color: "destructive" },
} as const satisfies Record<DocumentStatus, { label: string; color: string }>;

// キーのリストを抽出
const STATUS_KEYS = Object.keys(
  DOCUMENT_STATUS_CONFIG
) as (keyof typeof DOCUMENT_STATUS_CONFIG)[];

// ★ 追加: 検索フィルター用の型定義 ("ALL" を許容)
export type DocumentStatusFilter = DocumentStatus | "ALL";

/**
 * 検索UI（ドロップダウン）用の選択肢リスト
 * UI側ではこれを map するだけで済みます。
 */
export const STATUS_FILTER_OPTIONS = [
  { value: "ALL" as const, label: "すべて", color: "muted" }, // デフォルト
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
