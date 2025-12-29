import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { ErrorCode } from "@/lib/api/generated/model";
import { ApiError } from "@/lib/apiClient";

import { handleCommonError } from "../error-handler";
import { getErrorMessage } from "../error-mapping";

// Mock error-mapping
vi.mock("../error-mapping", () => ({
  getErrorMessage: vi.fn((code: ErrorCode) => `Mapped error: ${code}`),
}));

describe("error-handler", () => {
  let setError: ReturnType<typeof vi.fn>;
  let showToast: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setError = vi.fn();
    showToast = vi.fn();
    vi.clearAllMocks();
  });

  describe("handleCommonError", () => {
    it("handles ZodError and calls setError", () => {
      const zodError = new ZodError([
        {
          code: "custom",
          message: ErrorCode.VALIDATION_FAILED,
          path: ["field"],
        },
      ]);

      handleCommonError(zodError, setError, showToast, "Default error message");

      expect(getErrorMessage).toHaveBeenCalledWith(ErrorCode.VALIDATION_FAILED);
      expect(setError).toHaveBeenCalledWith("Mapped error: VALIDATION_FAILED");
      expect(showToast).not.toHaveBeenCalled();
    });

    it("handles ZodError with empty issues array", () => {
      const zodError = new ZodError([]);

      handleCommonError(zodError, setError, showToast, "Default error message");

      // getErrorMessage should be called with undefined
      expect(getErrorMessage).toHaveBeenCalledWith(undefined);
      expect(setError).toHaveBeenCalled();
      expect(showToast).not.toHaveBeenCalled();
    });

    it("handles ApiError and calls showToast", () => {
      const apiError = new ApiError(
        "API error message",
        ErrorCode.INTERNAL_SERVER_ERROR
      );

      handleCommonError(apiError, setError, showToast, "Default error message");

      expect(getErrorMessage).toHaveBeenCalledWith(
        ErrorCode.INTERNAL_SERVER_ERROR
      );
      expect(showToast).toHaveBeenCalledWith({
        type: "error",
        message: "Mapped error: INTERNAL_SERVER_ERROR",
      });
      expect(setError).not.toHaveBeenCalled();
    });

    it("handles ApiError without errorCode", () => {
      const apiError = new ApiError("API error message");

      handleCommonError(apiError, setError, showToast, "Default error message");

      expect(getErrorMessage).toHaveBeenCalledWith(undefined);
      expect(showToast).toHaveBeenCalledWith({
        type: "error",
        message: "Mapped error: undefined",
      });
      expect(setError).not.toHaveBeenCalled();
    });

    it("handles standard Error and calls showToast", () => {
      const error = new Error("Standard error message");

      handleCommonError(error, setError, showToast, "Default error message");

      expect(showToast).toHaveBeenCalledWith({
        type: "error",
        message: "Standard error message",
      });
      expect(setError).not.toHaveBeenCalled();
      expect(getErrorMessage).not.toHaveBeenCalled();
    });

    it("handles unknown error type and shows default message", () => {
      const unknownError = { someProperty: "value" };

      handleCommonError(
        unknownError,
        setError,
        showToast,
        "Default error message"
      );

      expect(showToast).toHaveBeenCalledWith({
        type: "error",
        message: "予期せぬエラーが発生しました",
      });
      expect(setError).not.toHaveBeenCalled();
      expect(getErrorMessage).not.toHaveBeenCalled();
    });

    it("handles null error", () => {
      handleCommonError(null, setError, showToast, "Default error message");

      expect(showToast).toHaveBeenCalledWith({
        type: "error",
        message: "予期せぬエラーが発生しました",
      });
      expect(setError).not.toHaveBeenCalled();
    });

    it("handles undefined error", () => {
      handleCommonError(
        undefined,
        setError,
        showToast,
        "Default error message"
      );

      expect(showToast).toHaveBeenCalledWith({
        type: "error",
        message: "予期せぬエラーが発生しました",
      });
      expect(setError).not.toHaveBeenCalled();
    });

    it("handles string error", () => {
      handleCommonError(
        "String error",
        setError,
        showToast,
        "Default error message"
      );

      expect(showToast).toHaveBeenCalledWith({
        type: "error",
        message: "予期せぬエラーが発生しました",
      });
      expect(setError).not.toHaveBeenCalled();
    });

    it("handles number error", () => {
      handleCommonError(123, setError, showToast, "Default error message");

      expect(showToast).toHaveBeenCalledWith({
        type: "error",
        message: "予期せぬエラーが発生しました",
      });
      expect(setError).not.toHaveBeenCalled();
    });
  });
});
