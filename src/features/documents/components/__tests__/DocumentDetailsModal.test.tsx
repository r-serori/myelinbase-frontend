import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import * as useDocuments from "@/features/documents/hooks/useDocuments";
import { DocumentStatus } from "@/lib/api/generated/model";

import DocumentDetailsModal from "../DocumentDetailsModal";

// Mock Hooks
vi.mock("@/features/documents/hooks/useDocuments", () => ({
  useDocumentById: vi.fn(),
  useUpdateDocumentTags: vi.fn(),
  useGetDocumentDownloadUrl: vi.fn(),
}));

// Mock UI components
vi.mock("@/components/ui/Modal", () => ({
  Modal: ({ children, isOpen, onClose, title }: any) =>
    isOpen ? (
      <div role="dialog">
        <h1>{title}</h1>
        <button onClick={onClose} aria-label="Close">
          X
        </button>
        {children}
      </div>
    ) : null,
}));

// Mock LightLoading
vi.mock("@/components/ui/LightLoading", () => ({
  default: ({ isLoading }: { isLoading: boolean }) =>
    isLoading ? <div data-testid="light-loading">Loading...</div> : null,
}));

// Mock Alert
vi.mock("@/components/ui/Alert", () => ({
  default: ({ children, color }: any) => (
    <div data-testid="alert" data-color={color}>
      {children}
    </div>
  ),
}));

// Mock Toast
const mockShowToast = vi.fn();
vi.mock("@/providers/ToastProvider", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

describe("DocumentDetailsModal", () => {
  const mockOnClose = vi.fn();
  const mockRefetch = vi.fn().mockResolvedValue(undefined);
  const mockUpdateTagsMutate = vi.fn();
  const mockGetDownloadUrlMutate = vi.fn();

  const createMockDoc = (overrides?: Partial<any>) => ({
    documentId: "1",
    fileName: "test.pdf",
    status: DocumentStatus.COMPLETED,
    createdAt: "2023-01-01T10:00:00Z",
    updatedAt: "2023-01-01T10:00:00Z",
    contentType: "application/pdf",
    fileSize: 1000,
    tags: [],
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc() },
      isLoading: false,
      refetch: mockRefetch,
    });

    (useDocuments.useUpdateDocumentTags as any).mockReturnValue({
      mutateAsync: mockUpdateTagsMutate,
      isPending: false,
    });

    (useDocuments.useGetDocumentDownloadUrl as any).mockReturnValue({
      mutateAsync: mockGetDownloadUrlMutate,
      isPending: false,
    });
  });

  it("shows loading spinner initially", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: null,
      isLoading: true,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);
    expect(screen.getByTestId("light-loading")).toBeInTheDocument();
  });

  it("renders document details", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: ["tag1"] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    expect(screen.getByText("test.pdf")).toBeInTheDocument();
    expect(screen.getByText("完了")).toBeInTheDocument();
    expect(screen.getByText(/2023\/01\/01/)).toBeInTheDocument();
    expect(screen.getByText("tag1")).toBeInTheDocument();
  });

  it("handles tag addition", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: [] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("新しいタグを入力...");
    fireEvent.change(input, { target: { value: "new-tag" } });

    const addButton = screen.getByRole("button", { name: /追加/ });
    fireEvent.click(addButton);

    expect(screen.getByText("new-tag")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("handles tag addition with Enter key", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: [] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("新しいタグを入力...");
    fireEvent.change(input, { target: { value: "new-tag" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(screen.getByText("new-tag")).toBeInTheDocument();
  });

  it("does not add duplicate tags", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: ["existing-tag"] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("新しいタグを入力...");
    fireEvent.change(input, { target: { value: "existing-tag" } });

    const addButton = screen.getByRole("button", { name: /追加/ });
    fireEvent.click(addButton);

    // タグは1つのまま（重複は追加されない）
    const tags = screen.getAllByText("existing-tag");
    expect(tags.length).toBe(1);
  });

  it("handles tag removal", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: ["tag1", "tag2"] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    // 削除ボタンをクリックしてタグを削除
    const deleteButton = screen.getAllByTitle("タグを削除")[0];
    fireEvent.click(deleteButton);

    // tag1が削除され、tag2のみが残る
    expect(screen.queryByText("tag1")).not.toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
  });

  it("calls updateTags on save", async () => {
    mockUpdateTagsMutate.mockResolvedValue(undefined);

    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: ["existing"] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    // Add a new tag
    const input = screen.getByPlaceholderText("新しいタグを入力...");
    fireEvent.change(input, { target: { value: "new-tag" } });
    fireEvent.click(screen.getByRole("button", { name: /追加/ }));

    // Click save
    const saveButton = screen.getByRole("button", { name: /タグを保存/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateTagsMutate).toHaveBeenCalledWith({
        documentId: "1",
        tags: ["existing", "new-tag"],
      });
      expect(mockRefetch).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith({
        type: "success",
        message: "タグを更新しました。",
      });
    });
  });

  it("disables save button when tags are unchanged", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: ["tag1"] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const saveButton = screen.getByRole("button", { name: /タグを保存/ });
    expect(saveButton).toBeDisabled();
  });

  it("disables save button when tags are empty", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: [] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const saveButton = screen.getByRole("button", { name: /タグを保存/ });
    expect(saveButton).toBeDisabled();
  });

  it("shows error message when tag update fails", async () => {
    const error = new Error("Update failed");
    mockUpdateTagsMutate.mockRejectedValue(error);

    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: ["tag1"] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    // Add a new tag
    const input = screen.getByPlaceholderText("新しいタグを入力...");
    fireEvent.change(input, { target: { value: "new-tag" } });
    fireEvent.click(screen.getByRole("button", { name: /追加/ }));

    // Click save
    const saveButton = screen.getByRole("button", { name: /タグを保存/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" })
      );
    });
  });

  it("shows warning when tag count exceeds limit", () => {
    const manyTags = Array.from({ length: 21 }, (_, i) => `tag${i + 1}`);
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: manyTags }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    expect(
      screen.getByText(/タグの上限（20個）を超えています/)
    ).toBeInTheDocument();
  });

  it("disables input and buttons when tag count exceeds limit", () => {
    const manyTags = Array.from({ length: 21 }, (_, i) => `tag${i + 1}`);
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: manyTags }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("新しいタグを入力...");
    const addButton = screen.getByRole("button", { name: /追加/ });
    const saveButton = screen.getByRole("button", { name: /タグを保存/ });

    expect(input).toBeDisabled();
    expect(addButton).toBeDisabled();
    expect(saveButton).toBeDisabled();
  });

  it("opens preview on button click", async () => {
    mockGetDownloadUrlMutate.mockResolvedValue({
      downloadUrl: "http://example.com/file.pdf",
    });

    // Mock window.open
    const mockOpen = vi.fn();
    vi.stubGlobal("open", mockOpen);

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const previewButton = screen.getByRole("button", {
      name: /ファイルを開く/,
    });
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(mockGetDownloadUrlMutate).toHaveBeenCalledWith("1");
      expect(mockOpen).toHaveBeenCalledWith(
        "http://example.com/file.pdf",
        "_blank",
        "noopener,noreferrer"
      );
    });
  });

  it("replaces localstack with localhost in preview URL", async () => {
    mockGetDownloadUrlMutate.mockResolvedValue({
      downloadUrl: "http://localstack.example.com/file.pdf",
    });

    const mockOpen = vi.fn();
    vi.stubGlobal("open", mockOpen);

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const previewButton = screen.getByRole("button", {
      name: /ファイルを開く/,
    });
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith(
        "http://localhost.example.com/file.pdf",
        "_blank",
        "noopener,noreferrer"
      );
    });
  });

  it("shows error toast when preview URL fetch fails", async () => {
    mockGetDownloadUrlMutate.mockRejectedValue(new Error("Fetch failed"));

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const previewButton = screen.getByRole("button", {
      name: /ファイルを開く/,
    });
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        type: "error",
        message: "プレビュー用URLの取得に失敗しました。",
      });
    });
  });

  it("does not show preview button for non-completed documents", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ status: DocumentStatus.PROCESSING }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    expect(
      screen.queryByRole("button", { name: /ファイルを開く/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/処理が完了するまでプレビュー機能は利用できません/)
    ).toBeInTheDocument();
  });

  it("shows status message for PROCESSING status", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ status: DocumentStatus.PROCESSING }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    expect(
      screen.getByText(
        /ステータスが「完了」になると、チャットで参照可能なファイルになります/
      )
    ).toBeInTheDocument();
  });

  it("shows status message for PENDING_UPLOAD status", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: {
        document: createMockDoc({ status: DocumentStatus.PENDING_UPLOAD }),
      },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    expect(
      screen.getByText(
        /ステータスが「完了」になると、チャットで参照可能なファイルになります/
      )
    ).toBeInTheDocument();
  });

  it("shows document not found message", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: null,
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    expect(
      screen.getByText("ドキュメントが見つかりませんでした。")
    ).toBeInTheDocument();
  });

  it("shows loading state when isPending is true for updateTags", () => {
    (useDocuments.useUpdateDocumentTags as any).mockReturnValue({
      mutateAsync: mockUpdateTagsMutate,
      isPending: true,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const saveButton = screen.getByRole("button", { name: /タグを保存/ });
    expect(saveButton).toBeDisabled();
  });

  it("shows loading state when isPending is true for getDownloadUrl", () => {
    (useDocuments.useGetDocumentDownloadUrl as any).mockReturnValue({
      mutateAsync: mockGetDownloadUrlMutate,
      isPending: true,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const previewButton = screen.getByRole("button", {
      name: /ファイルを開く/,
    });
    expect(previewButton).toBeDisabled();
  });

  it("shows empty tag message when no tags exist", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: [] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    expect(
      screen.getByText("タグはまだ設定されていません")
    ).toBeInTheDocument();
  });

  it("disables add button when input is empty", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: [] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const addButton = screen.getByRole("button", { name: /追加/ });
    expect(addButton).toBeDisabled();
  });

  it("calls onClose when close button is clicked", () => {
    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText("Close");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("displays tag count correctly", () => {
    (useDocuments.useDocumentById as any).mockReturnValue({
      data: { document: createMockDoc({ tags: ["tag1", "tag2", "tag3"] }) },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    expect(screen.getByText("3個")).toBeInTheDocument();
  });
});
