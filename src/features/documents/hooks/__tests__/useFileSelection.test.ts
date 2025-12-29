import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFileSelection } from "../useFileSelection";

// URL.createObjectURL mock
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

describe("useFileSelection", () => {
  it("initializes with empty state", () => {
    const { result } = renderHook(() => useFileSelection());
    expect(result.current.selectedFiles).toEqual([]);
    expect(result.current.previews).toEqual([]);
    expect(result.current.errorMessage).toBeNull();
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
  });

  it("renames duplicate files", async () => {
    const { result } = renderHook(() => useFileSelection());
    const file1 = new File(["content"], "test.txt", { type: "text/plain" });
    const file2 = new File(["content"], "test.txt", { type: "text/plain" });

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
    // .exe is not in ALLOWED_EXTENSIONS (assuming .pdf, .txt, .md, .markdown from code context)
    const file = new File(["content"], "test.exe", {
      type: "application/x-msdownload",
    });

    await act(async () => {
      await result.current.addFiles([file]);
    });

    expect(result.current.selectedFiles).toHaveLength(0);
    expect(result.current.errorMessage).toContain(
      "未対応形式のためスキップ"
    );
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
  });
});
