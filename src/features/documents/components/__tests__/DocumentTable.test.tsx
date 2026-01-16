import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DocumentResponse } from "@/lib/api/generated/model";

import DocumentTable from "../DocumentTable";

// Mock child components to simplify test
vi.mock("../StatusChip", () => ({
  default: ({ status }: { status: string }) => (
    <span data-testid="status-chip">{status}</span>
  ),
}));
vi.mock("../TagList", () => ({
  default: ({ tags }: { tags: string[] }) => (
    <div data-testid="tag-list">{tags.join(", ")}</div>
  ),
}));

describe("DocumentTable", () => {
  const mockDocuments: DocumentResponse[] = [
    {
      documentId: "1",
      fileName: "file1.txt",
      status: "COMPLETED",
      tags: ["tag1"],
      createdAt: "2023-01-01T10:00:00Z",
      contentType: "text/plain",
      fileSize: 1000,
      updatedAt: "2023-01-01T10:00:00Z",
    },
    {
      documentId: "2",
      fileName: "file2.pdf",
      status: "PROCESSING",
      tags: ["tag2"],
      createdAt: "2023-01-02T10:00:00Z",
      contentType: "application/pdf",
      fileSize: 2000,
      updatedAt: "2023-01-02T10:00:00Z",
    },
  ];

  const defaultProps = {
    hasPendingDocs: false,
    pendingCount: 0,
    documents: mockDocuments,
    loading: false,
    onDelete: vi.fn(),
    deletingId: null,
    onOpenDetails: vi.fn(),
    setConfirmTargetId: vi.fn(),
    setShowBatchDeleteConfirm: vi.fn(),
    onTagClick: vi.fn(),
    selectedIds: [],
    onSelect: vi.fn(),
    onSelectAll: vi.fn(),
  };

  it("renders table headers", () => {
    render(<DocumentTable {...defaultProps} />);
    expect(screen.getByText("ファイル名")).toBeInTheDocument();
    expect(screen.getByText("ステータス")).toBeInTheDocument();
    expect(screen.getByText("タグ")).toBeInTheDocument();
    expect(screen.getByText("作成日時")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
  });

  it("renders document rows", () => {
    render(<DocumentTable {...defaultProps} />);
    expect(screen.getByText("file1.txt")).toBeInTheDocument();
    expect(screen.getByText("file2.pdf")).toBeInTheDocument();

    // Check mocked components
    const statusChips = screen.getAllByTestId("status-chip");
    expect(statusChips[0]).toHaveTextContent("COMPLETED");
    expect(statusChips[1]).toHaveTextContent("PROCESSING");

    const tagLists = screen.getAllByTestId("tag-list");
    expect(tagLists[0]).toHaveTextContent("tag1");
  });

  it("shows loading state", () => {
    render(<DocumentTable {...defaultProps} loading={true} />);
    // LightLoading renders a spinner or skeleton.
    // Usually we check if rows are not present or loading indicator is present.
    // Assuming LightLoading has some accessible content or we mock it.
    // Let's rely on the fact that rows are not rendered when loading (except skeleton rows).
    // The component renders a specific TR for loading.
    // We can check for absence of file names if they are not in loading state.
    // But implementation: {loading && (<tr>...<LightLoading/>...</tr>)}
    // And {!loading && documents...}
    expect(screen.queryByText("file1.txt")).not.toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<DocumentTable {...defaultProps} documents={[]} />);
    expect(
      screen.getByText("ドキュメントが見つかりませんでした。")
    ).toBeInTheDocument();
  });

  it("handles selection", () => {
    render(<DocumentTable {...defaultProps} />);
    const checkboxes = screen.getAllByRole("checkbox");
    // First one is select all, others are per row.
    fireEvent.click(checkboxes[1]); // Select first row
    expect(defaultProps.onSelect).toHaveBeenCalledWith("1", true);
  });

  it("handles select all", () => {
    render(<DocumentTable {...defaultProps} />);
    const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(selectAllCheckbox);
    // PROCESSING状態のドキュメント（"2"）は除外されるため、"1"のみが渡される
    expect(defaultProps.onSelectAll).toHaveBeenCalledWith(["1"], true);
  });

  it("handles delete action", () => {
    render(<DocumentTable {...defaultProps} />);
    const deleteButtons = screen.getAllByTitle("削除");
    fireEvent.click(deleteButtons[0]);
    expect(defaultProps.onDelete).toHaveBeenCalledWith("1");
  });

  it("disables delete button for processing status", () => {
    render(<DocumentTable {...defaultProps} />);
    // PROCESSING状態のドキュメントの削除ボタンは "処理中のため削除できません" というtitleを持つ
    const processingDeleteButton =
      screen.getByTitle("処理中のため削除できません");
    expect(processingDeleteButton).toBeDisabled();
  });

  it("handles details action", () => {
    render(<DocumentTable {...defaultProps} />);
    const detailsButtons = screen.getAllByText("詳細");
    fireEvent.click(detailsButtons[0]);
    expect(defaultProps.onOpenDetails).toHaveBeenCalledWith("1");
  });

  it("pagination controls work", () => {
    // Need enough docs to trigger pagination (PAGE_SIZE = 20)
    const manyDocs = Array.from({ length: 25 }, (_, i) => ({
      ...mockDocuments[0],
      documentId: `${i}`,
      fileName: `file${i}.txt`,
    }));

    render(<DocumentTable {...defaultProps} documents={manyDocs} />);

    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("file0.txt")).toBeInTheDocument();
    expect(screen.queryByText("file20.txt")).not.toBeInTheDocument(); // 21st item

    const nextButton = screen.getByText(">");
    fireEvent.click(nextButton);

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText("file20.txt")).toBeInTheDocument();
  });
});
