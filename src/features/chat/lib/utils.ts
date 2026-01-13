import { UIMessage } from "ai";

import type {
  DataChunk,
  SourceChunk,
  TextDeltaChunk,
  TextUIPart,
} from "@/lib/api/generated/model";
import { SessionInfoPayload, SourceDocument } from "@/lib/api/generated/model";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * テキストパートかどうかの判定
 */
function isTextPart(part: unknown): part is TextUIPart {
  if (!isObject(part)) return false;
  return part.type === "text" && typeof part.text === "string";
}

/**
 * テキストデルタパートかどうかの判定
 * AI SDK v6 では text-delta チャンクが parts に格納される場合がある
 */
function isTextDeltaPart(part: unknown): part is TextDeltaChunk {
  if (!isObject(part)) return false;
  return part.type === "text-delta" && typeof part.textDelta === "string";
}

/**
 * ソースパートかどうかの判定
 */
function isSourcePart(part: unknown): part is SourceChunk {
  if (!isObject(part)) return false;
  if (part.type !== "source") return false;
  if (!isObject(part.source)) return false;
  return typeof part.source.sourceId === "string";
}

/**
 * データパートかどうかの判定
 * {"type":"data","data":[...]}
 */
function isDataPart(part: unknown): part is DataChunk {
  if (!isObject(part)) return false;
  return part.type === "data" && Array.isArray(part.data);
}

/**
 * CitationsPayloadアイテム型ガード
 */
function isCitationsItem(
  value: unknown
): value is { type: "citations"; citations: SourceDocument[] } {
  if (!isObject(value)) return false;
  return value.type === "citations" && Array.isArray(value.citations);
}

/**
 * SessionInfoアイテム型ガード
 */
function isSessionInfoItem(
  value: unknown
): value is { type: "session_info" } & SessionInfoPayload {
  if (!isObject(value)) return false;
  return (
    value.type === "session_info" &&
    typeof value.sessionId === "string" &&
    typeof value.historyId === "string" &&
    typeof value.createdAt === "string"
  );
}

/**
 * メッセージからテキスト部分を抽出して結合する
 * AI SDK v6 では text パートと text-delta パートの両方を処理する必要がある
 */
export function extractTextFromMessage(message: UIMessage): string {
  if (!message.parts || !Array.isArray(message.parts)) {
    return "";
  }

  const parts = message.parts as unknown[];
  const textParts: string[] = [];

  for (const part of parts) {
    if (isTextPart(part)) {
      textParts.push(part.text);
    } else if (isTextDeltaPart(part)) {
      textParts.push(part.textDelta);
    }
  }

  return textParts.join("");
}

/**
 * メッセージから参照ドキュメント（citations）を抽出する
 * UI Message Stream Protocol:
 * - source パート: {"type":"source","source":{...}}
 * - data パート内の citations: {"type":"data","data":[{"type":"citations",...}]}
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
    // 1. source パートから抽出
    if (isSourcePart(part)) {
      sourceDocuments.push({
        text: part.source.title || "",
        fileName: "",
        documentId: part.source.sourceId || "",
        score: 0,
      });
    }

    // 2. data パート内の citations から抽出
    if (isDataPart(part)) {
      for (const item of part.data) {
        if (isCitationsItem(item)) {
          sourceDocuments.push(...item.citations);
        }
      }
    }
  }

  return sourceDocuments.length > 0 ? sourceDocuments : undefined;
}

/**
 * メッセージの parts からセッション情報を抽出する
 * UI Message Stream Protocol: {"type":"data","data":[{"type":"session_info",...}]}
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
    // data パート内の session_info を探す
    if (isDataPart(part)) {
      for (const item of part.data) {
        if (isSessionInfoItem(item)) {
          return {
            sessionId: item.sessionId,
            historyId: item.historyId,
            createdAt: item.createdAt,
          };
        }
      }
    }
  }

  return undefined;
}
