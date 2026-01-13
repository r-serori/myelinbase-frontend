import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  extractCitationsFromMessage,
  extractSessionInfoFromMessage,
  extractTextFromMessage,
} from "../utils";

describe("chat/lib/utils", () => {
  describe("extractTextFromMessage", () => {
    it("extracts text from message with text parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "text", text: "Hello" },
          { type: "text", text: " World" },
        ],
      } as UIMessage;

      const result = extractTextFromMessage(message);
      expect(result).toBe("Hello World");
    });

    it("returns empty string when message has no parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [],
      } as UIMessage;

      const result = extractTextFromMessage(message);
      expect(result).toBe("");
    });

    it("returns empty string when parts is not an array", () => {
      const message = {
        id: "1",
        role: "assistant",
        parts: [],
      } as UIMessage;

      const result = extractTextFromMessage(message);
      expect(result).toBe("");
    });

    it("filters out non-text parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "text", text: "Hello" },
          {
            type: "source",
            source: {
              sourceId: "doc-1",
              title: "Document 1",
            },
          },
          { type: "text", text: " World" },
          {
            type: "data",
            data: [
              {
                type: "session_info",
                sessionId: "sess-1",
                historyId: "hist-1",
                createdAt: "2023-01-01T00:00:00Z",
              },
            ],
          },
        ],
      } as UIMessage;

      const result = extractTextFromMessage(message);
      expect(result).toBe("Hello World");
    });

    it("handles empty parts array", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [],
      } as UIMessage;

      const result = extractTextFromMessage(message);
      expect(result).toBe("");
    });

    it("extracts text from message with mixed text and text-delta parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "text", text: "Hello" },
          { type: "text-delta", textDelta: " from" },
          { type: "text-delta", textDelta: " World" },
        ],
      } as UIMessage;

      const result = extractTextFromMessage(message);
      expect(result).toBe("Hello from World");
    });
  });

  describe("extractCitationsFromMessage", () => {
    it("extracts citations from message with source-document parts", () => {
      const message = {
        id: "1",
        role: "assistant",
        parts: [
          {
            type: "source",
            source: {
              sourceId: "doc-1",
              title: "Document 1",
            },
          },
          {
            type: "source",
            source: {
              sourceId: "doc-2",
              title: "Document 2",
            },
          },
        ],
      } as unknown as UIMessage;

      const result = extractCitationsFromMessage(message);
      expect(result).toEqual([
        {
          text: "Document 1",
          fileName: "",
          documentId: "doc-1",
          score: 0,
        },
        {
          text: "Document 2",
          fileName: "",
          documentId: "doc-2",
          score: 0,
        },
      ]);
    });

    it("returns undefined when message has no parts", () => {
      const message = {
        id: "1",
        role: "assistant",
        parts: undefined,
      } as unknown as UIMessage;

      const result = extractCitationsFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("returns undefined when parts is not an array", () => {
      const message = {
        id: "1",
        role: "assistant",
        parts: null,
      } as unknown as UIMessage;

      const result = extractCitationsFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("returns undefined when no source-document parts found", () => {
      const message = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "text", text: "Hello" },
          {
            type: "data-session_info",
            data: {
              sessionId: "sess-1",
              historyId: "hist-1",
              createdAt: "2023-01-01T00:00:00Z",
            },
          },
        ],
      } as unknown as UIMessage;

      const result = extractCitationsFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("handles source-document parts with missing fields", () => {
      const message = {
        id: "1",
        role: "assistant",
        parts: [
          {
            type: "source",
            source: {
              sourceId: "",
              title: "",
            },
          },
        ],
      } as unknown as UIMessage;

      const result = extractCitationsFromMessage(message);
      expect(result).toEqual([
        {
          text: "",
          fileName: "",
          documentId: "",
          score: 0,
        },
      ]);
    });

    it("filters out non-source-document parts", () => {
      const message: UIMessage = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "text", text: "Hello" },
          {
            type: "source",
            source: {
              sourceId: "doc-1",
              title: "Document 1",
            },
          },
          {
            type: "data",
            data: [
              {
                type: "session_info",
                sessionId: "sess-1",
                historyId: "hist-1",
                createdAt: "2023-01-01T00:00:00Z",
              },
            ],
          },
        ],
      } as UIMessage;

      const result = extractCitationsFromMessage(message);
      expect(result).toEqual([
        {
          text: "Document 1",
          fileName: "",
          documentId: "doc-1",
          score: 0,
        },
      ]);
    });
  });

  describe("extractSessionInfoFromMessage", () => {
    it("extracts session info from message with data-session_info part", () => {
      const sessionInfo = {
        sessionId: "sess-123",
        historyId: "hist-456",
        createdAt: "2023-01-01T00:00:00Z",
      };

      const message = {
        id: "1",
        role: "assistant",
        parts: [
          {
            type: "data",
            data: [
              {
                type: "session_info",
                ...sessionInfo,
              },
            ],
          },
        ],
      } as unknown as UIMessage;

      const result = extractSessionInfoFromMessage(message);
      expect(result).toEqual(sessionInfo);
    });

    it("returns undefined when message has no parts", () => {
      const message = {
        id: "1",
        role: "assistant",
        parts: undefined,
      } as unknown as UIMessage;

      const result = extractSessionInfoFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("returns undefined when parts is not an array", () => {
      const message = {
        id: "1",
        role: "assistant",
        parts: null,
      } as unknown as UIMessage;

      const result = extractSessionInfoFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("returns undefined when no data-session_info part found", () => {
      const message = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "text", text: "Hello" },
          {
            type: "source",
            source: {
              sourceId: "doc-1",
              title: "Document 1",
            },
          },
        ],
      } as unknown as UIMessage;

      const result = extractSessionInfoFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("returns undefined when data-session_info part has invalid data", () => {
      const message = {
        id: "1",
        role: "assistant",
        parts: [
          {
            type: "data",
            data: [
              {
                type: "session_info",
                // 不完全なデータ（sessionIdが欠けている）
                historyId: "hist-456",
                createdAt: "2023-01-01T00:00:00Z",
              },
            ],
          },
        ],
      } as unknown as UIMessage;

      const result = extractSessionInfoFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("filters out non-data-session_info parts", () => {
      const sessionInfo = {
        sessionId: "sess-123",
        historyId: "hist-456",
        createdAt: "2023-01-01T00:00:00Z",
      };

      const message = {
        id: "1",
        role: "assistant",
        parts: [
          { type: "text", text: "Hello" },
          {
            type: "data",
            data: [
              {
                type: "session_info",
                ...sessionInfo,
              },
            ],
          },
          {
            type: "source",
            source: {
              sourceId: "doc-1",
              title: "Document 1",
            },
          },
        ],
      } as unknown as UIMessage;

      const result = extractSessionInfoFromMessage(message);
      expect(result).toEqual(sessionInfo);
    });

    it("returns undefined for data parts that are not data-session_info", () => {
      const message = {
        id: "1",
        role: "assistant",
        parts: [
          {
            type: "data-other",
            data: {
              sessionId: "sess-123",
              historyId: "hist-456",
              createdAt: "2023-01-01T00:00:00Z",
            },
          },
        ],
      } as unknown as UIMessage;

      const result = extractSessionInfoFromMessage(message);
      expect(result).toBeUndefined();
    });

    it("handles multiple data-session_info parts and returns the first valid one", () => {
      const sessionInfo1 = {
        sessionId: "sess-123",
        historyId: "hist-456",
        createdAt: "2023-01-01T00:00:00Z",
      };

      const sessionInfo2 = {
        sessionId: "sess-789",
        historyId: "hist-012",
        createdAt: "2023-01-02T00:00:00Z",
      };

      const message = {
        id: "1",
        role: "assistant",
        parts: [
          {
            type: "data",
            data: [
              {
                type: "session_info",
                ...sessionInfo1,
              },
              {
                type: "session_info",
                ...sessionInfo2,
              },
            ],
          },
        ],
      } as unknown as UIMessage;

      const result = extractSessionInfoFromMessage(message);
      // 最初の有効なセッション情報を返す
      expect(result).toEqual(sessionInfo1);
    });
  });
});
