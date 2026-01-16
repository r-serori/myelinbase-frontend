import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SourceDocument } from "@/lib/api/generated/model";

import DocumentPreviewSidebar from "../DocumentPreviewSidebar";

// useGetDocumentDownloadUrl のモック
const mutateAsyncMock = vi.fn();
vi.mock("@/features/documents/hooks/useDocuments", () => ({
  useGetDocumentDownloadUrl: () => ({
    mutateAsync: mutateAsyncMock,
  }),
}));

// useToast のモック
vi.mock("@/providers/ToastProvider", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// window.open のモック
const windowOpenMock = vi.fn();
global.window.open = windowOpenMock;

describe("DocumentPreviewSidebar", () => {
  const mockDocument: SourceDocument = {
    documentId: "doc-1",
    fileName: "test.pdf",
    text: "Document Content",
    score: 0.9,
  };

  const defaultProps = {
    document: mockDocument,
    isOpen: true,
    onClose: vi.fn(),
  };

  it("renders nothing when not open", () => {
    const { container } = render(
      <DocumentPreviewSidebar {...defaultProps} isOpen={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when document is null", () => {
    const { container } = render(
      <DocumentPreviewSidebar {...defaultProps} document={null} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders document content when open", () => {
    render(<DocumentPreviewSidebar {...defaultProps} />);
    expect(screen.getByText("test.pdf")).toBeInTheDocument();
    expect(screen.getByText("Document Content")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<DocumentPreviewSidebar {...defaultProps} />);
    // Close button (X icon)
    // Button variant="close"
    const closeButtons = screen.getAllByRole("button");
    // 最初のボタンが閉じるボタン（ヘッダーにある）
    fireEvent.click(closeButtons[0]);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("handles download button click", async () => {
    mutateAsyncMock.mockResolvedValue({
      downloadUrl: "https://example.com/download",
    });

    render(<DocumentPreviewSidebar {...defaultProps} />);

    const downloadButton = screen.getByText("元のファイルを開く");
    fireEvent.click(downloadButton);

    expect(mutateAsyncMock).toHaveBeenCalledWith("doc-1");
    // await for promise resolution
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(windowOpenMock).toHaveBeenCalledWith(
      "https://example.com/download",
      "_blank",
      "noopener,noreferrer"
    );
  });
});
