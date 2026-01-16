import { UIMessage } from "ai";

import { SessionInfoPayload, SourceDocument } from "@/lib/api/generated/model";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * AI SDK 6+ テキストパート判定
 */
function isTextPart(part: unknown): part is { type: "text"; text: string } {
  if (!isObject(part)) return false;
  return part.type === "text" && typeof part.text === "string";
}

/**
 * AI SDK 6+ data-session-info カスタムデータパート判定
 */
function isSessionInfoDataPart(part: unknown): part is {
  type: "data-session-info";
  data: { sessionId: string; historyId: string; createdAt: string };
} {
  if (!isObject(part)) return false;
  if (part.type !== "data-session-info") return false;
  if (!isObject(part.data)) return false;
  const data = part.data as Record<string, unknown>;
  return (
    typeof data.sessionId === "string" &&
    typeof data.historyId === "string" &&
    typeof data.createdAt === "string"
  );
}

/**
 * メッセージからテキスト部分を抽出して結合する
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
    }
  }

  return textParts.join("");
}

/**
 * data-citation のデータペイロードからSourceDocumentへの変換
 */
function parseCitationFromDataPayload(data: unknown): SourceDocument | null {
  if (!isObject(data)) return null;
  const d = data as Record<string, unknown>;

  if (
    typeof d.sourceId === "string" &&
    typeof d.fileName === "string" &&
    typeof d.text === "string" &&
    typeof d.score === "number"
  ) {
    return {
      documentId: d.sourceId,
      fileName: d.fileName,
      text: d.text,
      score: d.score,
    };
  }
  return null;
}

/**
 * メッセージから参照ドキュメント（citations）を抽出する
 */
export function extractCitationsFromMessage(
  message: UIMessage
): SourceDocument[] | undefined {
  if (!message.parts || !Array.isArray(message.parts)) {
    return undefined;
  }

  const parts = message.parts as unknown[];
  const sourceDocuments: SourceDocument[] = [];
  const seenIds = new Set<string>();

  for (const part of parts) {
    if (!isObject(part)) continue;

    if (part.type === "data-citation" && part.data) {
      const dataItems = Array.isArray(part.data) ? part.data : [part.data];

      for (const item of dataItems) {
        const citation = parseCitationFromDataPayload(item);
        if (citation && !seenIds.has(citation.documentId)) {
          sourceDocuments.push(citation);
          seenIds.add(citation.documentId);
        }
      }
    }
  }

  return sourceDocuments.length > 0 ? sourceDocuments : undefined;
}

/**
 * メッセージの parts からセッション情報を抽出する
 */
export function extractSessionInfoFromMessage(
  message: UIMessage
): SessionInfoPayload | undefined {
  if (!message.parts || !Array.isArray(message.parts)) {
    return undefined;
  }

  const parts = message.parts as unknown[];

  for (const part of parts) {
    if (isSessionInfoDataPart(part)) {
      return {
        sessionId: part.data.sessionId,
        historyId: part.data.historyId,
        createdAt: part.data.createdAt,
      };
    }
  }

  return undefined;
}
