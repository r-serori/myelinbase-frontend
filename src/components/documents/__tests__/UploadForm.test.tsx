import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UploadForm from "../UploadForm";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as useUpload from "@/hooks/useUpload";
import * as useFileSelection from "@/hooks/useFileSelection";

// Mock Hooks
vi.mock("@/hooks/useUpload", () => ({
  useUpload: vi.fn(),
}));
vi.mock("@/hooks/useFileSelection", () => ({
  useFileSelection: vi.fn(),
}));

// Mock Toast
const mockShowToast = vi.fn();
vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock UI components
vi.mock("../FilePreviewList", () => ({
  default: ({ previews, onRemove }: any) => (
    <div data-testid="preview-list">
      {previews.map((p: any) => (
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
    addFiles: mockAddFiles,
    removeFile: mockRemoveFile,
    clearFiles: mockClearFiles,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUpload.useUpload as any).mockReturnValue({
      uploadAsync: mockUploadAsync,
      isPending: false,
    });
    (useFileSelection.useFileSelection as any).mockReturnValue(
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
    (useFileSelection.useFileSelection as any).mockReturnValue({
      ...defaultFileSelection,
      selectedFiles: [new File([""], "test.txt")],
      previews: [
        {
          kind: "text",
          name: "test.txt",
          size: 0,
          mime: "text/plain",
          snippet: "",
        },
      ],
    });

    render(<UploadForm />);

    expect(screen.getByText("test.txt")).toBeInTheDocument();

    const removeButton = screen.getByText("Remove");
    fireEvent.click(removeButton);
    expect(mockRemoveFile).toHaveBeenCalledWith("test.txt");
  });

  it("handles tag input", () => {
    (useFileSelection.useFileSelection as any).mockReturnValue({
      ...defaultFileSelection,
      selectedFiles: [new File([""], "test.txt")],
    });

    render(<UploadForm />);

    const input = screen.getByPlaceholderText(/例: 就業規則/);
    fireEvent.change(input, { target: { value: "tag1" } });
    expect(input).toHaveValue("tag1");
  });

  it("calls uploadAsync on submit", async () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    (useFileSelection.useFileSelection as any).mockReturnValue({
      ...defaultFileSelection,
      selectedFiles: [file],
      previews: [
        {
          kind: "text",
          name: "test.txt",
          size: 7,
          mime: "text/plain",
          snippet: "",
        },
      ],
    });
    mockUploadAsync.mockResolvedValue([{ documentId: "doc1" }]);

    render(<UploadForm />);

    const submitButton = screen.getByText("アップロード開始");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUploadAsync).toHaveBeenCalledWith({
        files: [file],
        tags: [],
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" })
      );
    });
  });

  it("displays error message", () => {
    (useFileSelection.useFileSelection as any).mockReturnValue({
      ...defaultFileSelection,
      errorMessage: "エラーが発生しました",
    });

    render(<UploadForm />);
    expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
  });
});
