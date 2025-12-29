import { beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorCode } from "@/lib/api/generated/model";

import { ApiError, apiFetch, isApiError } from "../apiClient";

// Mock getJwt
vi.mock("@/features/auth/lib/auth", () => ({
  getJwt: vi.fn().mockResolvedValue("mock-token"),
}));

// Mock env
vi.mock("../env", () => ({
  env: {
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:3000",
  },
}));

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("isApiError", () => {
    it("returns true for ApiError instance", () => {
      const error = new ApiError("Test error", ErrorCode.VALIDATION_FAILED);
      expect(isApiError(error)).toBe(true);
    });

    it("returns false for standard Error", () => {
      const error = new Error("Test error");
      expect(isApiError(error)).toBe(false);
    });

    it("returns false for non-error object", () => {
      expect(isApiError({ message: "test" })).toBe(false);
      expect(isApiError(null)).toBe(false);
      expect(isApiError(undefined)).toBe(false);
      expect(isApiError("string")).toBe(false);
    });
  });

  describe("apiFetch", () => {
    it("successfully fetches JSON data", async () => {
      const mockData = { id: "1", name: "Test" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await apiFetch<typeof mockData>("/test");
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          }),
        })
      );
    });

    it("handles 204 No Content response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiFetch("/test");
      expect(result).toEqual({});
    });

    it("handles text response when JSON parsing fails", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("Not JSON");
        },
        text: async () => "plain text response",
      });

      const result = await apiFetch<string>("/test");
      expect(result).toBe("plain text response");
    });

    it("handles empty text response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("Not JSON");
        },
        text: async () => "",
      });

      const result = await apiFetch("/test");
      expect(result).toEqual({});
    });

    it("throws ApiError for non-ok response with errorCode", async () => {
      const errorResponse = {
        errorCode: ErrorCode.VALIDATION_FAILED,
        message: "Validation failed",
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      try {
        await apiFetch("/test");
        expect.fail("Should have thrown ApiError");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(isApiError(error)).toBe(true);
        if (isApiError(error)) {
          expect(error.message).toBe("Validation failed");
          expect(error.errorCode).toBe(ErrorCode.VALIDATION_FAILED);
        }
      }
    });

    it("throws ApiError for non-ok response without errorCode", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Not JSON");
        },
        text: async () => "Server Error",
      });

      try {
        await apiFetch("/test");
        expect.fail("Should have thrown ApiError");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(isApiError(error)).toBe(true);
        if (isApiError(error)) {
          expect(error.message).toBe("Server Error");
        }
      }
    });

    it("throws ApiError for non-ok response with status code only", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => {
          throw new Error("Not JSON");
        },
        text: async () => {
          throw new Error("No text");
        },
      });

      try {
        await apiFetch("/test");
        expect.fail("Should have thrown ApiError");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(isApiError(error)).toBe(true);
        if (isApiError(error)) {
          expect(error.message).toContain("404");
        }
      }
    });

    it("skips auth when skipAuth is true", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiFetch("/test", { skipAuth: true });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/test",
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      );
    });

    it("removes Content-Type header when body is FormData", async () => {
      const formData = new FormData();
      formData.append("file", new Blob(["content"]));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiFetch("/test", { body: formData });
      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty("Content-Type");
    });

    it("handles absolute URL path", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiFetch("https://example.com/api/test");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com/api/test",
        expect.any(Object)
      );
    });

    it("handles network errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError("Failed to fetch")
      );

      try {
        await apiFetch("/test");
        expect.fail("Should have thrown ApiError");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(isApiError(error)).toBe(true);
        if (isApiError(error)) {
          expect(error.message).toContain("ネットワークエラー");
          expect(error.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
        }
      }
    });

    it("re-throws non-network errors", async () => {
      const customError = new Error("Custom error");
      (global.fetch as any).mockRejectedValueOnce(customError);

      await expect(apiFetch("/test")).rejects.toThrow("Custom error");
      await expect(apiFetch("/test")).rejects.not.toThrow(ApiError);
    });
  });
});
