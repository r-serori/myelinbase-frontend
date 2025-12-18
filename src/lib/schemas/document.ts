import { z } from "zod";
import { ErrorCode } from "../types/error-code";

// =================================================================
// 定数定義 (Single Source of Truth)
// =================================================================

export const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md", ".markdown"];

/**
 * ステータス定義と日本語ラベルのマッピング
 * ユーザーが状態を区別しやすいよう、ラベルを一意に修正しました。
 */
export const DOCUMENT_STATUS_CONFIG = {
  // 正常フロー
  PENDING_UPLOAD: { label: "処理中", color: "muted" }, // アップロード待ち
  PROCESSING: { label: "処理中", color: "primary" }, // AI処理中・インデックス作成中
  COMPLETED: { label: "完了", color: "success" }, // 検索可能

  // エラー系
  FAILED: { label: "失敗", color: "destructive" },

  // 削除フロー
  DELETING: { label: "削除中", color: "warning" },
  DELETED: { label: "削除済", color: "muted" },
  DELETE_FAILED: { label: "削除失敗", color: "destructive" },
} as const;

// キーのリストを抽出
const STATUS_KEYS = Object.keys(
  DOCUMENT_STATUS_CONFIG
) as (keyof typeof DOCUMENT_STATUS_CONFIG)[];

// =================================================================
// 基本型定義
// =================================================================

export const DocumentStatusSchema = z.enum([
  STATUS_KEYS[0],
  ...STATUS_KEYS.slice(1),
]);

export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

// ★ 追加: 検索フィルター用の型定義 ("ALL" を許容)
export const DocumentStatusFilterSchema = z.union([
  DocumentStatusSchema,
  z.literal("ALL"),
]);

export type DocumentStatusFilter = z.infer<typeof DocumentStatusFilterSchema>;

/**
 * 検索UI（ドロップダウン）用の選択肢リスト
 * UI側ではこれを map するだけで済みます。
 */
export const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "すべて", color: "muted" }, // デフォルト
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
  return DOCUMENT_STATUS_CONFIG[status as DocumentStatus]?.label || status;
};

export const getDocumentStatusColor = (status: DocumentStatus): string => {
  return DOCUMENT_STATUS_CONFIG[status]?.color || "muted";
};

// =================================================================
// 以下、スキーマ定義 (変更なし)
// =================================================================

export const DocumentSchema = z.object({
  documentId: z.string(),
  fileName: z.string(),
  contentType: z.string(),
  fileSize: z.number(),
  tags: z.array(z.string()),
  status: DocumentStatusSchema,
  ownerId: z.string(),
  s3Key: z.string(),
  s3Path: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tagUpdatedAt: z.string().datetime().optional(),
  uploadUrlExpiresAt: z.string().optional(),
  processingStatus: z.string().optional(),
  errorMessage: z.string().optional(),
  deleteRequested: z.boolean().optional(),
  downloadUrl: z.string().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const DocumentResponseSchema = DocumentSchema.omit({
  ownerId: true,
});

export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;

export const FileMetadataSchema = z.object({
  fileName: z
    .string()
    .min(1)
    .max(255, ErrorCode.DOCUMENTS_INVALID_FILENAME_LENGTH_LIMIT)
    .refine(
      (name) =>
        ALLOWED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext)),
      {
        message: ErrorCode.DOCUMENTS_UNSUPPORTED_FILE_TYPE,
      }
    ),
  contentType: z.string(),
  fileSize: z
    .number()
    .min(0)
    .max(50 * 1024 * 1024, ErrorCode.DOCUMENTS_FILE_TOO_LARGE),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

// =================================================================
// リクエスト型定義
// =================================================================

export const UploadRequestRequestSchema = z.object({
  files: z.array(FileMetadataSchema).min(1),
  tags: z
    .array(z.string().max(50, ErrorCode.DOCUMENTS_TAG_LENGTH_LIMIT))
    .max(20, ErrorCode.DOCUMENTS_TAGS_TOO_MANY)
    .optional()
    .default([]),
});

export type UploadRequestRequest = z.infer<typeof UploadRequestRequestSchema>;

export const UpdateTagsRequestSchema = z.object({
  tags: z
    .array(z.string().max(50, ErrorCode.DOCUMENTS_TAG_LENGTH_LIMIT))
    .max(20, ErrorCode.DOCUMENTS_TAGS_TOO_MANY),
});

export type UpdateTagsRequest = z.infer<typeof UpdateTagsRequestSchema>;

export const BatchDeleteRequestSchema = z.object({
  documentIds: z
    .array(z.string().max(100))
    .min(1)
    .max(100, ErrorCode.INVALID_PARAMETER), // 仮のエラーコード
});

export type BatchDeleteRequest = z.infer<typeof BatchDeleteRequestSchema>;

// =================================================================
// レスポンス型定義
// =================================================================

export const GetDocumentsResponseSchema = z.object({
  documents: z.array(DocumentResponseSchema),
});

export type GetDocumentsResponse = z.infer<typeof GetDocumentsResponseSchema>;

export const GetDocumentResponseSchema = z.object({
  document: DocumentResponseSchema,
});

export type GetDocumentResponse = z.infer<typeof GetDocumentResponseSchema>;

export const UploadRequestResultSchema = z.object({
  documentId: z.string(),
  fileName: z.string(),
  uploadUrl: z.string(),
  expiresIn: z.number(),
  s3Key: z.string(),
});

export type UploadRequestResult = z.infer<typeof UploadRequestResultSchema>;

export const UploadRequestFileResultSchema = z.object({
  status: z.enum(["success", "error"]),
  fileName: z.string(),
  data: UploadRequestResultSchema.optional(),
  errorCode: z.string().optional(),
});

export type UploadRequestFileResult = z.infer<
  typeof UploadRequestFileResultSchema
>;

export const UploadRequestResponseSchema = z.object({
  results: z.array(UploadRequestFileResultSchema),
});

export type UploadRequestResponse = z.infer<typeof UploadRequestResponseSchema>;

export const DeleteDocumentResponseSchema = z.object({
  document: DocumentResponseSchema,
});

export type DeleteDocumentResponse = z.infer<
  typeof DeleteDocumentResponseSchema
>;

export const BatchDeleteResultSchema = z.object({
  documentId: z.string(),
  status: z.enum(["success", "error"]),
  errorCode: z.string().optional(),
});

export type BatchDeleteResult = z.infer<typeof BatchDeleteResultSchema>;

export const BatchDeleteResponseSchema = z.object({
  results: z.array(BatchDeleteResultSchema),
});

export type BatchDeleteResponse = z.infer<typeof BatchDeleteResponseSchema>;

export const UpdateTagsResponseSchema = z.object({
  document: DocumentResponseSchema,
});

export type UpdateTagsResponse = z.infer<typeof UpdateTagsResponseSchema>;

// =================================================================
// メタデータ型定義
// =================================================================

export const DocumentMetadataSchema = z.object({
  documentId: z.string(),
  fileName: z.string(),
  ownerId: z.string(),
  chunkIndex: z.number(),
  totalChunks: z.number(),
  text: z.string(),
  createdAt: z.string(),
});

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
