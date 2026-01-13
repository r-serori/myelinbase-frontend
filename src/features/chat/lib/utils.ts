import { UIMessage } from "ai";

import { SessionInfoPayload, SourceDocument } from "@/lib/api/generated/model";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * AI SDK 6+ テキストパート判定
 * Format: { type: "text", text: "..." }
 */
function isTextPart(part: unknown): part is { type: "text"; text: string } {
  if (!isObject(part)) return false;
  return part.type === "text" && typeof part.text === "string";
}

/**
 * AI SDK 6+ source-document パート判定
 * Format: { type: "source-document", sourceId: "...", mediaType: "...", title: "..." }
 */
function isSourceDocumentPart(part: unknown): part is {
  type: "source-document";
  sourceId: string;
  mediaType: string;
  title: string;
  providerMetadata?: { text?: string; score?: number };
} {
  if (!isObject(part)) return false;
  return part.type === "source-document" && typeof part.sourceId === "string";
}

/**
 * AI SDK 6+ data-session-info カスタムデータパート判定
 * Format: { type: "data-session-info", data: { sessionId, historyId, createdAt } }
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
 * AI SDK 6+ では text パートから抽出
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
 * メッセージから参照ドキュメント（citations）を抽出する
 * AI SDK 6+ UI Message Stream Protocol:
 * - source-document パート
 * - providerMetadata に score と text が含まれている
 writer.write({
            type: "source-document",
            sourceId: citation.documentId,
            mediaType: "text/plain",
            title: citation.fileName,
            providerMetadata: JSON.parse(
              JSON.stringify({
                score: citation.score,
                text: citation.text,
              })
            ),
          });
 */
export function extractCitationsFromMessage(
  message: UIMessage
): SourceDocument[] | undefined {
  if (!message.parts || !Array.isArray(message.parts)) {
    return undefined;
  }

  const parts = message.parts;
  const sourceDocuments: SourceDocument[] = [];

  for (const part of parts) {
    if (isSourceDocumentPart(part)) {
      sourceDocuments.push({
        text: (part.providerMetadata as { text: string })?.text || "",
        fileName: part.title || "",
        documentId: part.sourceId || "",
        score: (part.providerMetadata as { score: number })?.score || 0,
      });
    }
  }

  return sourceDocuments.length > 0 ? sourceDocuments : undefined;
}

/**
 * メッセージの parts からセッション情報を抽出する
 * AI SDK 6+ UI Message Stream Protocol:
 * - data-session-info カスタムデータパート
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
