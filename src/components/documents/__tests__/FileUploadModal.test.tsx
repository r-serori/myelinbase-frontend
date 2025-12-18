import { render, screen, fireEvent } from "@testing-library/react";
import FileUploadModal from "../FileUploadModal";
import { describe, it, expect, vi } from "vitest";

// Mock UploadForm
vi.mock("../UploadForm", () => ({
  default: ({ onUploaded }: { onUploaded: (docs: any[]) => void }) => (
    <div data-testid="upload-form">
      <button onClick={() => onUploaded([{ id: "doc1" }])}>
        Upload Complete
      </button>
    </div>
  ),
}));

// Mock Modal to render children immediately
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
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
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
      { id: "doc1" },
    ]);
    expect(defaultProps.refetch).toHaveBeenCalled();
    expect(defaultProps.setShowUploadModal).toHaveBeenCalledWith(false);
  });
});
