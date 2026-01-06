import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFileSelection } from "../useFileSelection";

// URL.createObjectURL mock
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

// computeFileHashのモック
vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual("@/lib/utils");
  return {
    ...actual,
    computeFileHash: vi.fn(),
  };
});

import { computeFileHash } from "@/lib/utils";

describe("useFileSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトでユニークなハッシュを返す
    vi.mocked(computeFileHash).mockImplementation(async (file: File) => {
      return `hash-${file.name}-${file.size}`;
    });
  });

  it("initializes with empty state", () => {
    const { result } = renderHook(() => useFileSelection());
    expect(result.current.selectedFiles).toEqual([]);
    expect(result.current.previews).toEqual([]);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.duplicateCount).toBe(0);
    expect(result.current.uploadableFiles).toEqual([]);
  });

  it("adds allowed files correctly", async () => {
    const { result } = renderHook(() => useFileSelection());
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    await act(async () => {
      await result.current.addFiles([file]);
    });

    expect(result.current.selectedFiles).toHaveLength(1);
    expect(result.current.selectedFiles[0].name).toBe("test.txt");
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.duplicateCount).toBe(0);
    expect(result.current.uploadableFiles).toHaveLength(1);
  });

  it("renames duplicate file names", async () => {
    const { result } = renderHook(() => useFileSelection());
    const file1 = new File(["content1"], "test.txt", { type: "text/plain" });
    const file2 = new File(["content2"], "test.txt", { type: "text/plain" });

    await act(async () => {
      await result.current.addFiles([file1]);
    });

    await act(async () => {
      await result.current.addFiles([file2]);
    });

    expect(result.current.selectedFiles).toHaveLength(2);
    expect(result.current.selectedFiles[0].name).toBe("test.txt");
    expect(result.current.selectedFiles[1].name).toBe("test (1).txt");
  });

  it("filters disallowed files", async () => {
    const { result } = renderHook(() => useFileSelection());
    const file = new File(["content"], "test.exe", {
      type: "application/x-msdownload",
    });

    await act(async () => {
      await result.current.addFiles([file]);
    });

    expect(result.current.selectedFiles).toHaveLength(0);
    expect(result.current.errorMessage).toContain("未対応形式のためスキップ");
  });

  it("removes file", async () => {
    const { result } = renderHook(() => useFileSelection());
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    await act(async () => {
      await result.current.addFiles([file]);
    });
    expect(result.current.selectedFiles).toHaveLength(1);

    await act(async () => {
      await result.current.removeFile("test.txt");
    });
    expect(result.current.selectedFiles).toHaveLength(0);
  });

  it("clears all files", async () => {
    const { result } = renderHook(() => useFileSelection());
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    await act(async () => {
      await result.current.addFiles([file]);
    });

    act(() => {
      result.current.clearFiles();
    });

    expect(result.current.selectedFiles).toHaveLength(0);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.duplicateCount).toBe(0);
    expect(result.current.fileHashes.size).toBe(0);
  });

  describe("重複コンテンツ検出", () => {
    it("同じ内容のファイルを検出して重複としてマークする", async () => {
      // 同じハッシュを返すようにモック
      const sameHash = "same-hash-value";
      vi.mocked(computeFileHash).mockResolvedValue(sameHash);

      const { result } = renderHook(() => useFileSelection());

      const file1 = new File(["same content"], "file1.txt", {
        type: "text/plain",
      });
      const file2 = new File(["same content"], "file2.txt", {
        type: "text/plain",
      });

      await act(async () => {
        await result.current.addFiles([file1, file2]);
      });

      await waitFor(() => {
        expect(result.current.duplicateCount).toBe(1);
      });

      expect(result.current.selectedFiles).toHaveLength(2);
      expect(result.current.uploadableFiles).toHaveLength(1);
      expect(result.current.uploadableFiles[0].name).toBe("file1.txt");
    });

    it("異なる内容のファイルは重複としてマークしない", async () => {
      // 異なるハッシュを返すようにモック
      vi.mocked(computeFileHash)
        .mockResolvedValueOnce("hash1")
        .mockResolvedValueOnce("hash2");

      const { result } = renderHook(() => useFileSelection());

      const file1 = new File(["content1"], "file1.txt", {
        type: "text/plain",
      });
      const file2 = new File(["content2"], "file2.txt", {
        type: "text/plain",
      });

      await act(async () => {
        await result.current.addFiles([file1, file2]);
      });

      await waitFor(() => {
        expect(result.current.duplicateCount).toBe(0);
      });

      expect(result.current.selectedFiles).toHaveLength(2);
      expect(result.current.uploadableFiles).toHaveLength(2);
    });

    it("3つの同じファイルがある場合、2つを重複としてマークする", async () => {
      const sameHash = "same-hash-value";
      vi.mocked(computeFileHash).mockResolvedValue(sameHash);

      const { result } = renderHook(() => useFileSelection());

      const files = [
        new File(["same"], "a.txt", { type: "text/plain" }),
        new File(["same"], "b.txt", { type: "text/plain" }),
        new File(["same"], "c.txt", { type: "text/plain" }),
      ];

      await act(async () => {
        await result.current.addFiles(files);
      });

      await waitFor(() => {
        expect(result.current.duplicateCount).toBe(2);
      });

      expect(result.current.selectedFiles).toHaveLength(3);
      expect(result.current.uploadableFiles).toHaveLength(1);
    });

    it("重複ファイルを削除すると重複状態が更新される", async () => {
      const sameHash = "same-hash-value";
      vi.mocked(computeFileHash).mockResolvedValue(sameHash);

      const { result } = renderHook(() => useFileSelection());

      const file1 = new File(["same"], "file1.txt", { type: "text/plain" });
      const file2 = new File(["same"], "file2.txt", { type: "text/plain" });

      await act(async () => {
        await result.current.addFiles([file1, file2]);
      });

      await waitFor(() => {
        expect(result.current.duplicateCount).toBe(1);
      });

      // file2（重複）を削除
      await act(async () => {
        await result.current.removeFile("file2.txt");
      });

      await waitFor(() => {
        expect(result.current.duplicateCount).toBe(0);
      });

      expect(result.current.selectedFiles).toHaveLength(1);
      expect(result.current.uploadableFiles).toHaveLength(1);
    });

    it("プレビューに重複情報が含まれる", async () => {
      const sameHash = "same-hash-value";
      vi.mocked(computeFileHash).mockResolvedValue(sameHash);

      const { result } = renderHook(() => useFileSelection());

      const file1 = new File(["same"], "first.txt", { type: "text/plain" });
      const file2 = new File(["same"], "second.txt", { type: "text/plain" });

      await act(async () => {
        await result.current.addFiles([file1, file2]);
      });

      await waitFor(() => {
        expect(result.current.previews).toHaveLength(2);
      });

      // 最初のファイルは重複ではない
      expect(result.current.previews[0].isDuplicate).toBe(false);

      // 2番目のファイルは重複
      expect(result.current.previews[1].isDuplicate).toBe(true);
      expect(result.current.previews[1].duplicateOf).toBe("first.txt");
    });
  });
});
