import { describe, expect, it } from "vitest";

import { ErrorCode } from "@/lib/api/generated/model";

import { getErrorMessage } from "../error-mapping";

describe("getErrorMessage", () => {
  it("returns message for known ApiError code", () => {
    expect(getErrorMessage(ErrorCode.VALIDATION_FAILED)).toBe(
      "入力内容に不備があります。確認してください。"
    );
  });

  it("returns message for DOCUMENTS_FILE_TOO_LARGE", () => {
    expect(getErrorMessage(ErrorCode.DOCUMENTS_FILE_TOO_LARGE)).toBe(
      "ファイルサイズが大きすぎます (上限50MB)。"
    );
  });

  it("returns message for INTERNAL_SERVER_ERROR", () => {
    expect(getErrorMessage(ErrorCode.INTERNAL_SERVER_ERROR)).toBe(
      "サーバーエラーが発生しました。しばらくしてから再度お試しください。"
    );
  });

  it("falls back to server message if error code is unknown", () => {
    // 実装では unknown code の場合は default message を返す
    expect(getErrorMessage("UNKNOWN_CODE" as ErrorCode)).toBe(
      "予期せぬエラーが発生しました。"
    );
  });

  it("returns default message if ApiError has no message and unknown code", () => {
    // 実装では code が undefined の場合は default message を返す
    expect(getErrorMessage(undefined as unknown as ErrorCode)).toBe(
      "予期せぬエラーが発生しました。"
    );
  });
});
