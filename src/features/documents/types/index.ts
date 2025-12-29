/**
 * このファイルはZodスキーマ（バリデーション用）のみを提供します。
 * 型定義は生成された型定義（@/lib/api/generated/model）を使用してください。
 * UI用の設定は @/lib/config/document-status.ts を参照してください。
 */

import { z } from "zod";

import { DocumentStatus } from "@/lib/api/generated/model";

// =================================================================
// 基本型定義（生成された型定義を使用）
// =================================================================

// DocumentStatusは生成された型定義を使用
export const DocumentStatusSchema = z.enum(DocumentStatus);

// ★ 追加: 検索フィルター用の型定義 ("ALL" を許容)
export const DocumentStatusFilterSchema = z.union([
  DocumentStatusSchema,
  z.literal("ALL"),
]);

export type DocumentStatusFilter = z.infer<typeof DocumentStatusFilterSchema>;
