import { getErrorMessage } from "../error-mapping";
import { ApiError } from "@/lib/apiClient";
import { ErrorCode } from "@/lib/types/error-code";
import { describe, it, expect } from "vitest";

describe("getErrorMessage", () => {
  it("returns message for known ApiError code", () => {
    const error = new ApiError(
      400,
      "Server message",
      undefined,
      ErrorCode.VALIDATION_FAILED
    );
    expect(getErrorMessage(error)).toBe(
      "入力内容に不備があります。確認してください。"
    );
  });

  it("returns message for DOCUMENTS_FILE_TOO_LARGE", () => {
    const error = new ApiError(
      400,
      "Error",
      undefined,
      ErrorCode.DOCUMENTS_FILE_TOO_LARGE
    );
    expect(getErrorMessage(error)).toBe(
      "ファイルサイズが大きすぎます (上限50MB)。"
    );
  });

  it("returns message for CHAT_BEDROCK_ERROR", () => {
    const error = new ApiError(
      500,
      "Error",
      undefined,
      ErrorCode.CHAT_BEDROCK_ERROR
    );
    expect(getErrorMessage(error)).toBe(
      "AIサービスの呼び出しに失敗しました。時間をおいて再試行してください。"
    );
  });

  it("falls back to server message if error code is unknown", () => {
    const error = new ApiError(
      400,
      "Custom server error",
      undefined,
      "UNKNOWN_CODE"
    );
    expect(getErrorMessage(error)).toBe("Custom server error");
  });

  it("returns default message if ApiError has no message and unknown code", () => {
    // message is empty string
    const error = new ApiError(400, "", undefined, "UNKNOWN_CODE");
    expect(getErrorMessage(error)).toBe("予期せぬエラーが発生しました。");
  });

  it("returns message from standard Error", () => {
    const error = new Error("Network error");
    expect(getErrorMessage(error)).toBe("Network error");
  });

  it("returns default message for unknown object", () => {
    const error = { some: "object" };
    expect(getErrorMessage(error)).toBe("予期せぬエラーが発生しました。");
  });
});
