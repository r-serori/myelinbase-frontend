import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as useFileSelection from "@/features/documents/hooks/useFileSelection";
import * as useUpload from "@/features/documents/hooks/useUpload";

import type { Preview } from "../FilePreviewList";
import UploadForm from "../UploadForm";

// Mock Hooks
vi.mock("@/features/documents/hooks/useUpload", () => ({
  useUpload: vi.fn(),
}));
vi.mock("@/features/documents/hooks/useFileSelection", () => ({
  useFileSelection: vi.fn(),
}));

// Mock Toast
const mockShowToast = vi.fn();
vi.mock("@/providers/ToastProvider", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock UI components
vi.mock("../FilePreviewList", () => ({
  default: ({
    previews,
    onRemove,
    duplicateCount,
  }: {
    previews: Preview[];
    onRemove: (name: string) => void;
    duplicateCount?: number;
  }) => (
    <div data-testid="preview-list">
      {duplicateCount && duplicateCount > 0 && (
        <div data-testid="duplicate-warning">{duplicateCount}件の重複</div>
      )}
      {previews.map((p) => (
        <div key={p.name}>
          {p.name} <button onClick={() => onRemove(p.name)}>Remove</button>
        </div>
      ))}
    </div>
  ),
}));

describe("UploadForm", () => {
  const mockUploadAsync = vi.fn();
  const mockAddFiles = vi.fn();
  const mockRemoveFile = vi.fn();
  const mockClearFiles = vi.fn();
  const mockSetErrorMessage = vi.fn();

  const defaultFileSelection = {
    selectedFiles: [],
    previews: [],
    errorMessage: null,
    setErrorMessage: mockSetErrorMessage,
    isProcessing: false,
    progress: { current: 0, total: 0 },
    addFiles: mockAddFiles,
    removeFile: mockRemoveFile,
    clearFiles: mockClearFiles,
    // 重複関連
    fileHashes: new Map<string, string>(),
    duplicateFiles: new Map<string, string | null>(),
    duplicateCount: 0,
    uploadableFiles: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUpload.useUpload).mockReturnValue({
      upload: vi.fn(),
      uploadAsync: mockUploadAsync,
      isPending: false,
      progress: {},
      status: "idle",
      error: null,
    });
    vi.mocked(useFileSelection.useFileSelection).mockReturnValue(
      defaultFileSelection
    );
  });

  it("renders dropzone and file input", () => {
    render(<UploadForm />);
    expect(screen.getByText(/クリックしてファイルを選択/)).toBeInTheDocument();
    expect(screen.getByText("フォルダを選択")).toBeInTheDocument();
  });

  it("handles file selection via input", () => {
    render(<UploadForm />);

    const dropzone = screen
      .getByText(/クリックしてファイルを選択/)
      .closest("div");
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    if (dropzone) {
      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });
      expect(mockAddFiles).toHaveBeenCalled();
    }
  });

  it("renders selected files and allows removal", () => {
    const file = new File([""], "test.txt");
    vi.mocked(useFileSelection.useFileSelection).mockReturnValue({
      ...defaultFileSelection,
      selectedFiles: [file],
      uploadableFiles: [file],
      previews: [
        {
          kind: "text",
          name: "test.txt",
          size: 0,
          mime: "text/plain",
          snippet: "",
          isDuplicate: false,
          duplicateOf: null,
        },
      ],
    });

    render(<UploadForm />);

    expect(screen.getByText("test.txt")).toBeInTheDocument();

    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);
    // removeFileはskipDuplicateRecalcオプションを受け取る
    expect(mockRemoveFile).toHaveBeenCalledWith("test.txt", {
      skipDuplicateRecalc: false,
    });
  });

  it("handles tag input", () => {
    const file = new File([""], "test.txt");
    vi.mocked(useFileSelection.useFileSelection).mockReturnValue({
      ...defaultFileSelection,
      selectedFiles: [file],
      uploadableFiles: [file],
    });

    render(<UploadForm />);

    const input = screen.getByPlaceholderText(/例: 就業規則/);
    fireEvent.change(input, { target: { value: "tag1" } });
    expect(input).toHaveValue("tag1");
  });

  it("calls uploadAsync on submit with uploadableFiles", async () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const fileHashes = new Map([["test.txt", "abc123"]]);

    vi.mocked(useFileSelection.useFileSelection).mockReturnValue({
      ...defaultFileSelection,
      selectedFiles: [file],
      uploadableFiles: [file],
      fileHashes,
      previews: [
        {
          kind: "text",
          name: "test.txt",
          size: 7,
          mime: "text/plain",
          snippet: "",
          isDuplicate: false,
          duplicateOf: null,
        },
      ],
    });
    // uploadAsyncはUploadResultSummaryを返す
    mockUploadAsync.mockResolvedValue({
      successCount: 1,
      backendDuplicateCount: 0,
      otherErrorCount: 0,
      totalRequested: 1,
    });

    render(<UploadForm />);

    const submitButton = screen.getByText("アップロード開始");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUploadAsync).toHaveBeenCalledWith({
        files: [file],
        tags: [],
        fileHashes,
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" })
      );
    });
  });

  it("displays error message", () => {
    vi.mocked(useFileSelection.useFileSelection).mockReturnValue({
      ...defaultFileSelection,
      errorMessage: "エラーが発生しました",
    });

    render(<UploadForm />);
    expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
  });

  describe("重複ファイル処理", () => {
    it("重複がある場合、アップロード対象件数をボタンに表示する", () => {
      const file1 = new File(["content"], "file1.txt", { type: "text/plain" });
      const file2 = new File(["content"], "file2.txt", { type: "text/plain" });

      vi.mocked(useFileSelection.useFileSelection).mockReturnValue({
        ...defaultFileSelection,
        selectedFiles: [file1, file2],
        uploadableFiles: [file1], // file2は重複
        duplicateCount: 1,
        previews: [
          {
            kind: "text",
            name: "file1.txt",
            size: 7,
            mime: "text/plain",
            snippet: "",
            isDuplicate: false,
            duplicateOf: null,
          },
          {
            kind: "text",
            name: "file2.txt",
            size: 7,
            mime: "text/plain",
            snippet: "",
            isDuplicate: true,
            duplicateOf: "file1.txt",
          },
        ],
      });

      render(<UploadForm />);

      expect(screen.getByText("アップロード開始 (1件)")).toBeInTheDocument();
    });

    it("アップロード対象がない場合はボタンを無効化する", () => {
      const file = new File(["content"], "file.txt", { type: "text/plain" });

      vi.mocked(useFileSelection.useFileSelection).mockReturnValue({
        ...defaultFileSelection,
        selectedFiles: [file],
        uploadableFiles: [], // すべて重複
        duplicateCount: 1,
        previews: [
          {
            kind: "text",
            name: "file.txt",
            size: 7,
            mime: "text/plain",
            snippet: "",
            isDuplicate: true,
            duplicateOf: "existing.txt",
          },
        ],
      });

      render(<UploadForm />);

      const submitButton = screen.getByRole("button", {
        name: /アップロード開始/,
      });
      expect(submitButton).toBeDisabled();
    });

    it("重複がある場合、成功メッセージに除外件数を含める", async () => {
      const file1 = new File(["content"], "file1.txt", { type: "text/plain" });

      vi.mocked(useFileSelection.useFileSelection).mockReturnValue({
        ...defaultFileSelection,
        selectedFiles: [file1],
        uploadableFiles: [file1],
        duplicateCount: 1,
        fileHashes: new Map([["file1.txt", "hash1"]]),
        previews: [
          {
            kind: "text",
            name: "file1.txt",
            size: 7,
            mime: "text/plain",
            snippet: "",
            isDuplicate: false,
            duplicateOf: null,
          },
        ],
      });

      // uploadAsyncはUploadResultSummaryを返す
      mockUploadAsync.mockResolvedValue({
        successCount: 1,
        backendDuplicateCount: 0,
        otherErrorCount: 0,
        totalRequested: 1,
      });

      render(<UploadForm />);

      const submitButton = screen.getByText(/アップロード開始/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        // 実装では、重複がある場合「1件アップロード完了、1件は選択時に除外」という形式
        expect(mockShowToast).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "success",
            message: expect.stringContaining("1件アップロード完了"),
          })
        );
      });
    });
  });
});
