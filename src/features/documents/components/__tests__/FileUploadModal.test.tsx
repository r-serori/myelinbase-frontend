import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DocumentResponse } from "@/lib/api/generated/model";

import FileUploadModal from "../FileUploadModal";

// Mock UploadForm
vi.mock("../UploadForm", () => ({
  default: ({
    onUploaded,
  }: {
    onUploaded: (docs: DocumentResponse[]) => void;
  }) => (
    <div data-testid="upload-form">
      <button
        onClick={() =>
          onUploaded([
            {
              documentId: "doc1",
              fileName: "test.pdf",
              contentType: "application/pdf",
              fileSize: 1000,
              status: "COMPLETED",
              tags: [],
              createdAt: "2023-01-01T00:00:00Z",
              updatedAt: "2023-01-01T00:00:00Z",
              ownerId: "user1",
            } as DocumentResponse,
          ])
        }
      >
        Upload Complete
      </button>
    </div>
  ),
}));

// Mock Modal to render children immediately
vi.mock("@/components/ui/Modal", () => ({
  Modal: ({
    children,
    isOpen,
    onClose,
    title,
  }: {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
  }) =>
    isOpen ? (
      <div role="dialog">
        <h1>{title}</h1>
        <button onClick={onClose} aria-label="Close">
          X
        </button>
        {children}
      </div>
    ) : null,
  ModalBody: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ModalHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("FileUploadModal", () => {
  const defaultProps = {
    showUploadModal: true,
    setShowUploadModal: vi.fn(),
    refetch: vi.fn(),
    onAppendDocuments: vi.fn(),
  };

  it("renders modal when open", () => {
    render(<FileUploadModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("ファイルアップロード")).toBeInTheDocument();
    expect(screen.getByTestId("upload-form")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<FileUploadModal {...defaultProps} showUploadModal={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<FileUploadModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(defaultProps.setShowUploadModal).toHaveBeenCalledWith(false);
  });

  it("handles upload completion correctly", () => {
    render(<FileUploadModal {...defaultProps} />);

    // Click the button in mocked UploadForm to simulate upload completion
    fireEvent.click(screen.getByText("Upload Complete"));

    expect(defaultProps.onAppendDocuments).toHaveBeenCalledWith([
      {
        documentId: "doc1",
        fileName: "test.pdf",
        contentType: "application/pdf",
        fileSize: 1000,
        status: "COMPLETED",
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        ownerId: "user1",
      },
    ]);
    expect(defaultProps.refetch).toHaveBeenCalled();
    expect(defaultProps.setShowUploadModal).toHaveBeenCalledWith(false);
  });
});
