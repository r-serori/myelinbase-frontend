import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FilePreviewList, { Preview } from "../FilePreviewList";

describe("FilePreviewList", () => {
  const mockPreviews: Preview[] = [
    {
      kind: "text",
      name: "file1.txt",
      size: 1024,
      mime: "text/plain",
      snippet: "content",
      isDuplicate: false,
      duplicateOf: null,
    },
    {
      kind: "pdf",
      name: "file2.pdf",
      size: 2048,
      mime: "application/pdf",
      url: "blob:url",
      isDuplicate: false,
      duplicateOf: null,
    },
  ];

  const defaultProps = {
    previews: mockPreviews,
    onRemove: vi.fn(),
    onPreviewClick: vi.fn(),
    selectedFilesCount: 2,
    duplicateCount: 0,
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
    const removeButtons = screen.getAllByTitle("削除");
    fireEvent.click(removeButtons[0]);
    expect(defaultProps.onRemove).toHaveBeenCalledWith("file1.txt");
  });

  describe("重複ファイル表示", () => {
    const previewsWithDuplicate: Preview[] = [
      {
        kind: "text",
        name: "original.txt",
        size: 1024,
        mime: "text/plain",
        snippet: "content",
        isDuplicate: false,
        duplicateOf: null,
      },
      {
        kind: "text",
        name: "duplicate.txt",
        size: 1024,
        mime: "text/plain",
        snippet: "content",
        isDuplicate: true,
        duplicateOf: "original.txt",
      },
    ];

    it("重複がある場合に警告バッジを表示する", () => {
      render(
        <FilePreviewList
          {...defaultProps}
          previews={previewsWithDuplicate}
          duplicateCount={1}
        />
      );

      expect(screen.getByText("1件の重複")).toBeInTheDocument();
    });

    it("重複ファイルに警告メッセージを表示する", () => {
      render(
        <FilePreviewList
          {...defaultProps}
          previews={previewsWithDuplicate}
          duplicateCount={1}
        />
      );

      expect(
        screen.getByText("「original.txt」と同じ内容")
      ).toBeInTheDocument();
    });

    it("重複説明メッセージを表示する", () => {
      render(
        <FilePreviewList
          {...defaultProps}
          previews={previewsWithDuplicate}
          duplicateCount={1}
        />
      );

      expect(
        screen.getByText(
          "同じ内容のファイルがあります。重複ファイルはアップロード時に自動で除外されます。"
        )
      ).toBeInTheDocument();
    });

    it("重複がない場合は警告を表示しない", () => {
      render(<FilePreviewList {...defaultProps} />);

      expect(screen.queryByText(/件の重複/)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/アップロード時に自動で除外/)
      ).not.toBeInTheDocument();
    });
  });
});
