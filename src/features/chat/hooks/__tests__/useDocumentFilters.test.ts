import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useDocumentFilters } from "@/features/documents/hooks/useDocumentFilters";
import type { DocumentResponse } from "@/lib/api/generated/model";

const mockDocuments: DocumentResponse[] = [
  {
    documentId: "1",
    fileName: "MeetingNotes.txt",
    status: "COMPLETED",
    tags: ["meeting", "internal"],
    createdAt: "2023-01-01T00:00:00Z",
    contentType: "text/plain",
    fileSize: 100,
    updatedAt: "2023-01-01T00:00:00Z",
  },
  {
    documentId: "2",
    fileName: "ProjectSpec.pdf",
    status: "PROCESSING",
    tags: ["project", "spec"],
    createdAt: "2023-01-02T00:00:00Z",
    contentType: "application/pdf",
    fileSize: 200,
    updatedAt: "2023-01-02T00:00:00Z",
  },
  {
    documentId: "3",
    fileName: "UntaggedDoc.md",
    status: "COMPLETED",
    tags: [],
    createdAt: "2023-01-03T00:00:00Z",
    contentType: "text/markdown",
    fileSize: 150,
    updatedAt: "2023-01-03T00:00:00Z",
  },
];

describe("useDocumentFilters", () => {
  it("initializes with all documents", () => {
    const { result } = renderHook(() => useDocumentFilters(mockDocuments));
    expect(result.current.filteredDocuments).toHaveLength(3);
    expect(result.current.hasConditions).toBe(false);
  });

  it("filters by filename", () => {
    const { result } = renderHook(() => useDocumentFilters(mockDocuments));

    act(() => {
      result.current.actions.setFilenameInput("Meeting");
    });
    act(() => {
      result.current.actions.applyFilters();
    });

    expect(result.current.filteredDocuments).toHaveLength(1);
    expect(result.current.filteredDocuments[0].fileName).toBe(
      "MeetingNotes.txt"
    );
    expect(result.current.hasConditions).toBe(true);
  });

  it("filters by status", () => {
    const { result } = renderHook(() => useDocumentFilters(mockDocuments));

    act(() => {
      result.current.actions.setStatusFilter("PROCESSING");
    });
    // Status filter applies immediately in implementation?
    // Checking implementation: statusFilter is in `filters`, used in `filteredDocuments`.
    // Wait, statusFilter updates `filters.statusFilter`.
    // `filteredDocuments` depends on `filters.statusFilter`.
    // It seems status filter applies immediately without explicitly calling `applyFilters`?
    // Let's check implementation again:
    // `if (filters.statusFilter !== "ALL") { docs = docs.filter(...) }`
    // Yes, it uses `filters.statusFilter` directly, unlike text inputs which move to `applied`.

    expect(result.current.filteredDocuments).toHaveLength(1);
    expect(result.current.filteredDocuments[0].status).toBe("PROCESSING");
  });

  it("filters by tags (OR mode)", () => {
    const { result } = renderHook(() => useDocumentFilters(mockDocuments));

    act(() => {
      result.current.actions.setTagsInput("meeting");
    });
    act(() => {
      result.current.actions.applyFilters();
    });

    expect(result.current.filteredDocuments).toHaveLength(1);
    expect(result.current.filteredDocuments[0].tags).toContain("meeting");
  });

  it("filters by tags (AND mode)", () => {
    const { result } = renderHook(() => useDocumentFilters(mockDocuments));

    // Document 1 has ["meeting", "internal"]
    act(() => {
      result.current.actions.setTagMode("AND");
      result.current.actions.setTagsInput("meeting, internal");
    });
    act(() => {
      result.current.actions.applyFilters();
    });

    expect(result.current.filteredDocuments).toHaveLength(1);
    expect(result.current.filteredDocuments[0].documentId).toBe("1");
  });

  it("filters untagged documents", () => {
    const { result } = renderHook(() => useDocumentFilters(mockDocuments));

    act(() => {
      result.current.actions.setIsUntaggedInput(true);
    });
    act(() => {
      result.current.actions.applyFilters();
    });

    expect(result.current.filteredDocuments).toHaveLength(1);
    expect(result.current.filteredDocuments[0].fileName).toBe("UntaggedDoc.md");
  });

  it("clears all filters", () => {
    const { result } = renderHook(() => useDocumentFilters(mockDocuments));

    act(() => {
      result.current.actions.setFilenameInput("Meeting");
    });
    act(() => {
      result.current.actions.applyFilters();
    });
    expect(result.current.filteredDocuments).toHaveLength(1);

    act(() => {
      result.current.actions.clearAll();
    });
    expect(result.current.filteredDocuments).toHaveLength(3);
    expect(result.current.hasConditions).toBe(false);
  });
});
