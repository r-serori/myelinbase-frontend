import { render, screen, fireEvent } from "@testing-library/react";
import TagChip from "../TagChip";
import { vi } from "vitest";

describe("TagChip", () => {
  const defaultProps = {
    tag: "Test Tag",
    onClick: vi.fn(),
  };

  it("renders tag name", () => {
    render(<TagChip {...defaultProps} />);
    expect(screen.getByText("Test Tag")).toBeInTheDocument();
  });

  it("renders as a button when not isDeleted", () => {
    render(<TagChip {...defaultProps} isDeleted={false} />);
    const button = screen.getByRole("button", { name: "Test Tag" });
    expect(button).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    render(<TagChip {...defaultProps} />);
    fireEvent.click(screen.getByText("Test Tag"));
    expect(defaultProps.onClick).toHaveBeenCalledWith("Test Tag");
  });

  it("renders remove button when isDeleted is true", () => {
    render(<TagChip {...defaultProps} isDeleted={true} />);
    // Text is present
    expect(screen.getByText("Test Tag")).toBeInTheDocument();
    // Delete button (X icon) is present. 
    // Usually buttons with icons might have an aria-label or title.
    // The component has title="タグを削除" on the button.
    const deleteButton = screen.getByTitle("タグを削除");
    expect(deleteButton).toBeInTheDocument();
  });

  it("calls onClick when remove button is clicked in isDeleted mode", () => {
    render(<TagChip {...defaultProps} isDeleted={true} />);
    const deleteButton = screen.getByTitle("タグを削除");
    fireEvent.click(deleteButton);
    expect(defaultProps.onClick).toHaveBeenCalledWith("Test Tag");
  });
});

