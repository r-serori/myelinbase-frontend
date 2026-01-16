import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpload } from "../useUpload";

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
    } as unknown as ReturnType<typeof usePostDocumentsUpload>);
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
});
