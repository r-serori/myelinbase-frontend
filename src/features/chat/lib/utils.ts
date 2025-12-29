import { UIMessage } from "ai";

import { SessionInfoPayload, SourceDocument } from "@/lib/api/generated/model";

// =================================================================
// カスタム型定義と型ガード
// =================================================================

type TextPart = {
  type: "text";
  text: string;
};

type SourceDocumentPart = {
  type: "source-document";
  sourceId?: string;
  title?: string;
  filename?: string;
  mediaType?: string;
};

type DataPart = {
  type: `data-${string}`;
  data: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * テキストパートかどうかの判定
 */
function isTextPart(part: unknown): part is TextPart {
  if (!isObject(part)) return false;
  return part.type === "text" && typeof part.text === "string";
}

/**
 * 参照ドキュメントパートかどうかの判定
 */
function isSourceDocumentPart(part: unknown): part is SourceDocumentPart {
  if (!isObject(part)) return false;
  return part.type === "source-document";
}

/**
 * データパートかどうかの判定
 */
function isDataPart(part: unknown): part is DataPart {
  if (!isObject(part)) return false;
  return typeof part.type === "string" && part.type.startsWith("data-");
}

/**
 * SessionInfoPayload型ガード
 * Orvalで生成された型を使用
 */
function isSessionInfoPayload(value: unknown): value is SessionInfoPayload {
  if (!isObject(value)) return false;
  return (
    typeof value.sessionId === "string" &&
    typeof value.historyId === "string" &&
    typeof value.createdAt === "string"
  );
}

// =================================================================
// 抽出関数
// =================================================================

/**
 * メッセージからテキスト部分を抽出して結合する
 */
export function extractTextFromMessage(message: UIMessage): string {
  if (!message.parts || !Array.isArray(message.parts)) {
    return "";
  }

  return (message.parts as unknown[])
    .filter(isTextPart)
    .map((part) => part.text)
    .join("");
}

/**
 * メッセージから参照ドキュメント（citations）を抽出する
 * source-document パートのみを対象とする
 */
export function extractCitationsFromMessage(
  message: UIMessage
): SourceDocument[] | undefined {
  if (!message.parts || !Array.isArray(message.parts)) {
    return undefined;
  }

  const parts = message.parts as unknown[];
  const sourceDocuments: SourceDocument[] = [];

  for (const part of parts) {
    if (isSourceDocumentPart(part)) {
      sourceDocuments.push({
        text: part.title || "",
        fileName: part.filename || "",
        documentId: part.sourceId || "",
        score: 0,
      });
    }
  }

  return sourceDocuments.length > 0 ? sourceDocuments : undefined;
}

/**
 * メッセージの parts からセッション情報を抽出する
 * バックエンドから data-session_info チャンクとして送信される
 *
 * @param message - UIMessage
 * @returns SessionInfoPayload | undefined (Orval生成の型)
 */
export function extractSessionInfoFromMessage(
  message: UIMessage
): SessionInfoPayload | undefined {
  if (!message.parts || !Array.isArray(message.parts)) {
    return undefined;
  }

  const parts = message.parts as unknown[];

  for (const part of parts) {
    if (isDataPart(part) && part.type === "data-session_info") {
      if (isSessionInfoPayload(part.data)) {
        return part.data;
      }
    }
  }

  return undefined;
}
