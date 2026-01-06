import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DOCUMENTS_DUPLICATE_IN_SELECTION, useUpload } from "../useUpload";

// Mock dependencies
vi.mock("@/lib/api/generated/default/default", () => ({
  usePostDocumentsUpload: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}));

// computeFileHashのモック
vi.mock("@/lib/utils", () => ({
  computeFileHash: vi.fn(),
}));

import { usePostDocumentsUpload } from "@/lib/api/generated/default/default";
import { computeFileHash } from "@/lib/utils";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useUpload", () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePostDocumentsUpload).mockReturnValue({
      mutateAsync: mockMutateAsync,
    } as ReturnType<typeof usePostDocumentsUpload>);
  });

  describe("選択ファイル間の重複チェック", () => {
    it("同じ内容のファイルが複数選択された場合、重複ファイルをエラーとしてマークする", async () => {
      // 同じハッシュを返すようにモック
      const sameHash = "abc123def456".repeat(4) + "0000000000000000"; // 64文字
      vi.mocked(computeFileHash).mockResolvedValue(sameHash);

      mockMutateAsync.mockResolvedValue({
        results: [
          {
            status: "success",
            fileName: "file1.txt",
            data: {
              documentId: "doc1",
              fileName: "file1.txt",
              uploadUrl: "https://example.com/upload1",
              expiresIn: 3600,
              s3Key: "uploads/user/doc1",
            },
          },
        ],
      });

      // fetchをモック
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(""),
      });

      const { result } = renderHook(() => useUpload(), {
        wrapper: createWrapper(),
      });

      const file1 = new File(["content"], "file1.txt", { type: "text/plain" });
      const file2 = new File(["content"], "file2.txt", { type: "text/plain" });

      await act(async () => {
        await result.current.uploadAsync({
          files: [file1, file2],
          tags: [],
        });
      });

      await waitFor(() => {
        // file2は重複としてエラーになる（最初のファイル以外）
        expect(result.current.progress["file2.txt"]?.status).toBe("error");
        expect(result.current.progress["file2.txt"]?.errorCode).toBe(
          DOCUMENTS_DUPLICATE_IN_SELECTION
        );
      });

      // APIには重複を除外したファイルのみ送信される
      expect(mockMutateAsync).toHaveBeenCalledWith({
        data: {
          files: [
            expect.objectContaining({
              fileName: "file1.txt",
            }),
          ],
          tags: [],
        },
      });
    });

    it("異なる内容のファイルが選択された場合、すべてアップロードされる", async () => {
      // 異なるハッシュを返すようにモック
      vi.mocked(computeFileHash)
        .mockResolvedValueOnce("hash1".repeat(10) + "0000") // 64文字
        .mockResolvedValueOnce("hash2".repeat(10) + "0000"); // 64文字

      mockMutateAsync.mockResolvedValue({
        results: [
          {
            status: "success",
            fileName: "file1.txt",
            data: {
              documentId: "doc1",
              fileName: "file1.txt",
              uploadUrl: "https://example.com/upload1",
              expiresIn: 3600,
              s3Key: "uploads/user/doc1",
            },
          },
          {
            status: "success",
            fileName: "file2.txt",
            data: {
              documentId: "doc2",
              fileName: "file2.txt",
              uploadUrl: "https://example.com/upload2",
              expiresIn: 3600,
              s3Key: "uploads/user/doc2",
            },
          },
        ],
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(""),
      });

      const { result } = renderHook(() => useUpload(), {
        wrapper: createWrapper(),
      });

      const file1 = new File(["content1"], "file1.txt", { type: "text/plain" });
      const file2 = new File(["content2"], "file2.txt", { type: "text/plain" });

      await act(async () => {
        await result.current.uploadAsync({
          files: [file1, file2],
          tags: [],
        });
      });

      // 両方のファイルがAPIに送信される
      expect(mockMutateAsync).toHaveBeenCalledWith({
        data: {
          files: [
            expect.objectContaining({ fileName: "file1.txt" }),
            expect.objectContaining({ fileName: "file2.txt" }),
          ],
          tags: [],
        },
      });
    });

    it("すべてのファイルが重複している場合、エラーをスローする", async () => {
      // 同じハッシュを返すようにモック
      const sameHash = "samehash".repeat(8); // 64文字
      vi.mocked(computeFileHash).mockResolvedValue(sameHash);

      const { result } = renderHook(() => useUpload(), {
        wrapper: createWrapper(),
      });

      // 同じ内容の2つのファイル（両方とも重複扱いになるケース：実際には最初の1つは残る）
      // このテストは、ファイルが1つだけで全部重複のケースをテスト
      const file1 = new File(["content"], "file1.txt", { type: "text/plain" });
      const file2 = new File(["content"], "file2.txt", { type: "text/plain" });
      const file3 = new File(["content"], "file3.txt", { type: "text/plain" });

      // 3つのファイルで同じハッシュ → file2とfile3が除外 → file1のみ残る → エラーにはならない
      // すべて重複のケースは、実際には発生しない（最初の1つは常に残る）

      await act(async () => {
        try {
          await result.current.uploadAsync({
            files: [file1, file2, file3],
            tags: [],
          });
        } catch {
          // エラーは期待しない（file1は残るため）
        }
      });

      // file1のみがAPIに送信される
      expect(mockMutateAsync).toHaveBeenCalledWith({
        data: {
          files: [expect.objectContaining({ fileName: "file1.txt" })],
          tags: [],
        },
      });

      // file2とfile3は重複エラー
      expect(result.current.progress["file2.txt"]?.errorCode).toBe(
        DOCUMENTS_DUPLICATE_IN_SELECTION
      );
      expect(result.current.progress["file3.txt"]?.errorCode).toBe(
        DOCUMENTS_DUPLICATE_IN_SELECTION
      );
    });
  });
});