import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DocumentDetailsModal from "../DocumentDetailsModal";
import { vi } from "vitest";
import * as useDocuments from "@/hooks/useDocuments";

// Mock Hooks
vi.mock("@/hooks/useDocuments", () => ({
  useDocumentStatus: vi.fn(),
  useUpdateDocumentTags: vi.fn(),
  useGetDocumentDownloadUrl: vi.fn(),
}));

// Mock UI components if necessary (Modal is usually fine if mocked or handled in setup)
vi.mock("../ui/Modal", () => ({
  Modal: ({ children, isOpen, onClose, title }: any) => isOpen ? (
    <div role="dialog">
      <h1>{title}</h1>
      <button onClick={onClose} aria-label="Close">X</button>
      {children}
    </div>
  ) : null,
}));

// Mock Toast
const mockShowToast = vi.fn();
vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

describe("DocumentDetailsModal", () => {
  const mockOnClose = vi.fn();
  const mockRefetch = vi.fn();
  const mockUpdateTagsMutate = vi.fn();
  const mockGetDownloadUrlMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

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
    (useDocuments.useDocumentStatus as any).mockReturnValue({
      data: null,
      isLoading: true,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);
    expect(screen.getByText("データを読み込んでいます...")).toBeInTheDocument();
  });

  it("renders document details", () => {
    const mockDoc = {
      documentId: "1",
      fileName: "test.pdf",
      status: "COMPLETED",
      createdAt: "2023-01-01T10:00:00Z",
      tags: ["tag1"],
    };
    (useDocuments.useDocumentStatus as any).mockReturnValue({
      data: { document: mockDoc },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    expect(screen.getByText("test.pdf")).toBeInTheDocument();
    // Check status chip presence (StatusChip renders label, for COMPLETED it's "完了")
    // Note: StatusChip implementation depends on schema. Assuming "完了" or "COMPLETED" text is present.
    // If StatusChip is real, it renders "完了". If mocked, we might need to adjust.
    // Here we use real StatusChip (not mocked globally), so check for text.
    expect(screen.getByText("完了")).toBeInTheDocument();
    // Timezone dependent, checking date part or adjusting to local time
    // For now, loose check or expected formatted string
    expect(screen.getByText(/2023\/01\/01/)).toBeInTheDocument();
    expect(screen.getByText("tag1")).toBeInTheDocument();
  });

  it("handles tag addition", async () => {
    const mockDoc = {
      documentId: "1",
      fileName: "test.pdf",
      status: "COMPLETED",
      tags: [],
    };
    (useDocuments.useDocumentStatus as any).mockReturnValue({
      data: { document: mockDoc },
      isLoading: false,
      refetch: mockRefetch,
    });

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const input = screen.getByPlaceholderText("新しいタグを入力...");
    fireEvent.change(input, { target: { value: "new-tag" } });
    
    const addButton = screen.getByRole("button", { name: /追加/ });
    fireEvent.click(addButton);

    expect(screen.getByText("new-tag")).toBeInTheDocument();
  });

  it("calls updateTags on save", async () => {
    const mockDoc = {
      documentId: "1",
      fileName: "test.pdf",
      status: "COMPLETED",
      tags: ["existing"],
    };
    (useDocuments.useDocumentStatus as any).mockReturnValue({
      data: { document: mockDoc },
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
      expect(mockShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
    });
  });

  it("opens preview on button click", async () => {
    const mockDoc = {
      documentId: "1",
      fileName: "test.pdf",
      status: "COMPLETED",
      tags: [],
    };
    (useDocuments.useDocumentStatus as any).mockReturnValue({
      data: { document: mockDoc },
      isLoading: false,
      refetch: mockRefetch,
    });

    mockGetDownloadUrlMutate.mockResolvedValue({ downloadUrl: "http://example.com/file.pdf" });
    
    // Mock window.open
    const mockOpen = vi.fn();
    vi.stubGlobal("open", mockOpen);

    render(<DocumentDetailsModal documentId="1" onClose={mockOnClose} />);

    const previewButton = screen.getByRole("button", { name: /ファイルを開く/ });
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(mockGetDownloadUrlMutate).toHaveBeenCalledWith("1");
      expect(mockOpen).toHaveBeenCalledWith("http://example.com/file.pdf", "_blank", "noopener,noreferrer");
    });
  });
});

