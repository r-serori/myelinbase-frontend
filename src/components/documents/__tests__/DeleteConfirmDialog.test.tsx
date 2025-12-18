import { render, screen, fireEvent } from "@testing-library/react";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import { vi } from "vitest";

// Mock Modal since it might use portals or complex logic not needed for this unit test
// However, integration test with real Modal is better if possible. 
// Assuming Modal renders children when isOpen is true.

describe("DeleteConfirmDialog", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Test File.txt",
    count: 1,
    isDeleting: false,
  };

  it("renders dialog when open", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    expect(screen.getByText("削除の確認")).toBeInTheDocument();
    // Use getAllByText because the filename appears in the prompt and the input placeholder/helper
    const filenameElements = screen.getAllByText(/Test File.txt/);
    expect(filenameElements.length).toBeGreaterThan(0);
  });

  it("renders multiple deletion message correctly", () => {
    render(<DeleteConfirmDialog {...defaultProps} count={3} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/件のドキュメントを完全に削除しますか？/)).toBeInTheDocument();
  });

  it("disables delete button initially", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    const deleteButton = screen.getByRole("button", { name: "削除する" });
    expect(deleteButton).toBeDisabled();
  });

  it("enables delete button when correct text is entered", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText("Test File.txt");
    fireEvent.change(input, { target: { value: "Test File.txt" } });
    
    const deleteButton = screen.getByRole("button", { name: "削除する" });
    expect(deleteButton).not.toBeDisabled();
  });

  it("enables delete button when '全て削除' is entered for multiple files", () => {
    render(<DeleteConfirmDialog {...defaultProps} count={3} />);
    const input = screen.getByPlaceholderText("全て削除");
    fireEvent.change(input, { target: { value: "全て削除" } });
    
    const deleteButton = screen.getByRole("button", { name: "削除する" });
    expect(deleteButton).not.toBeDisabled();
  });

  it("calls onConfirm when delete button is clicked", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText("Test File.txt");
    fireEvent.change(input, { target: { value: "Test File.txt" } });
    
    const deleteButton = screen.getByRole("button", { name: "削除する" });
    fireEvent.click(deleteButton);
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it("calls onClose when cancel button is clicked", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);
    const cancelButton = screen.getByRole("button", { name: "キャンセル" });
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows deleting state", () => {
    render(<DeleteConfirmDialog {...defaultProps} isDeleting={true} />);
    expect(screen.getByText("削除中...")).toBeInTheDocument();
    const deleteButton = screen.getByRole("button", { name: "削除中..." });
    expect(deleteButton).toBeDisabled();
  });
});

