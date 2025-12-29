import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import FilePreviewList, { Preview } from "../FilePreviewList";

describe("FilePreviewList", () => {
  const mockPreviews: Preview[] = [
    {
      kind: "text",
      name: "file1.txt",
      size: 1024,
      mime: "text/plain",
      snippet: "content",
    },
    {
      kind: "pdf",
      name: "file2.pdf",
      size: 2048,
      mime: "application/pdf",
      url: "blob:url",
    },
  ];

  const defaultProps = {
    previews: mockPreviews,
    onRemove: vi.fn(),
    onPreviewClick: vi.fn(),
    selectedFilesCount: 2,
  };

  it("renders file list correctly", () => {
    render(<FilePreviewList {...defaultProps} />);
    expect(screen.getByText("選択中のファイル (2)")).toBeInTheDocument();
    expect(screen.getByText("file1.txt")).toBeInTheDocument();
    expect(screen.getByText("file2.pdf")).toBeInTheDocument();
    expect(screen.getByText("1.0 KB")).toBeInTheDocument();
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
  });

  it("calls onPreviewClick when file name is clicked", () => {
    render(<FilePreviewList {...defaultProps} />);
    fireEvent.click(screen.getByText("file1.txt"));
    expect(defaultProps.onPreviewClick).toHaveBeenCalledWith(mockPreviews[0]);
  });

  it("calls onRemove when remove button is clicked", () => {
    render(<FilePreviewList {...defaultProps} />);
    // Find remove buttons. They have title="削除"
    const removeButtons = screen.getAllByTitle("削除");
    fireEvent.click(removeButtons[0]);
    expect(defaultProps.onRemove).toHaveBeenCalledWith("file1.txt");
  });
});
