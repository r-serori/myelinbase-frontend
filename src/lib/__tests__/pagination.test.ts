import { describe, expect, it } from "vitest";

import { decodeCursor, encodeCursor } from "../pagination";

describe("pagination", () => {
  describe("encodeCursor", () => {
    it("encodes simple string value", () => {
      const result = encodeCursor("test-value");
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("encodes object value", () => {
      const value = { id: "123", timestamp: "2023-01-01" };
      const result = encodeCursor(value);
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("encodes number value", () => {
      const result = encodeCursor(123);
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("encodes null value", () => {
      const result = encodeCursor(null);
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });
  });

  describe("decodeCursor", () => {
    it("decodes encoded string value", () => {
      const original = "test-value";
      const encoded = encodeCursor(original);
      const decoded = decodeCursor<string>(encoded);
      expect(decoded).toBe(original);
    });

    it("decodes encoded object value", () => {
      const original = { id: "123", timestamp: "2023-01-01" };
      const encoded = encodeCursor(original);
      const decoded = decodeCursor<typeof original>(encoded);
      expect(decoded).toEqual(original);
    });

    it("decodes encoded number value", () => {
      const original = 123;
      const encoded = encodeCursor(original);
      const decoded = decodeCursor<number>(encoded);
      expect(decoded).toBe(original);
    });

    it("returns undefined for undefined input", () => {
      const result = decodeCursor(undefined);
      expect(result).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      const result = decodeCursor("");
      expect(result).toBeUndefined();
    });

    it("returns undefined for invalid base64 string", () => {
      const result = decodeCursor("invalid-base64!!!");
      expect(result).toBeUndefined();
    });

    it("returns undefined for invalid JSON in cursor", () => {
      // 有効なbase64だが、JSONとして無効な文字列
      const invalidJson = Buffer.from("not-json").toString("base64");
      const result = decodeCursor(invalidJson);
      expect(result).toBeUndefined();
    });

    it("handles round-trip encoding and decoding", () => {
      const complexValue = {
        sessionId: "sess-123",
        lastKey: { pk: "user#123", sk: "session#456" },
        timestamp: new Date().toISOString(),
      };
      const encoded = encodeCursor(complexValue);
      const decoded = decodeCursor<typeof complexValue>(encoded);
      expect(decoded).toEqual(complexValue);
    });
  });
});
