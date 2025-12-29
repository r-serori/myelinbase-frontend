import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type DocumentResponse,
  DocumentStatus,
} from "@/lib/api/generated/model";
import { queryKeys } from "@/lib/queryKeys";

import { usePendingDocumentsPolling } from "../usePendingDocumentsPolling";

// QueryClientのモックを作成
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

describe("usePendingDocumentsPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("初期状態でpendingドキュメントがない場合、hasPendingDocsはfalseを返す", () => {
    const documents: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "completed.pdf",
        status: DocumentStatus.COMPLETED,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const { result } = renderHook(() => usePendingDocumentsPolling(documents), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasPendingDocs).toBe(false);
    expect(result.current.pendingCount).toBe(0);
  });

  it("documentsがundefinedの場合、hasPendingDocsはfalseを返す", () => {
    const { result } = renderHook(() => usePendingDocumentsPolling(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasPendingDocs).toBe(false);
    expect(result.current.pendingCount).toBe(0);
  });

  it("PENDING_UPLOADステータスのドキュメントがある場合、hasPendingDocsはtrueを返す", () => {
    const documents: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const { result } = renderHook(() => usePendingDocumentsPolling(documents), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasPendingDocs).toBe(true);
    expect(result.current.pendingCount).toBe(1);
  });

  it("PROCESSINGステータスのドキュメントがある場合、hasPendingDocsはtrueを返す", () => {
    const documents: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "processing.pdf",
        status: DocumentStatus.PROCESSING,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const { result } = renderHook(() => usePendingDocumentsPolling(documents), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasPendingDocs).toBe(true);
    expect(result.current.pendingCount).toBe(1);
  });

  it("複数のpendingドキュメントがある場合、正しいカウントを返す", () => {
    const documents: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending1.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
      {
        documentId: "2",
        fileName: "processing1.pdf",
        status: DocumentStatus.PROCESSING,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 2000,
      },
      {
        documentId: "3",
        fileName: "completed.pdf",
        status: DocumentStatus.COMPLETED,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 3000,
      },
    ];

    const { result } = renderHook(() => usePendingDocumentsPolling(documents), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasPendingDocs).toBe(true);
    expect(result.current.pendingCount).toBe(2);
  });

  it("pendingドキュメントがある場合、5秒ごとにinvalidateQueriesが呼ばれる", () => {
    const documents: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => usePendingDocumentsPolling(documents), {
      wrapper,
    });

    // 初期状態では呼ばれない
    expect(invalidateSpy).not.toHaveBeenCalled();

    // 5秒経過
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.documents,
    });

    // さらに5秒経過（合計10秒）
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(2);

    // さらに5秒経過（合計15秒）
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(3);
  });

  it("pendingドキュメントがなくなった場合、ポーリングが停止する", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const initialDocuments: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const { result, rerender } = renderHook(
      ({ documents }) => usePendingDocumentsPolling(documents),
      {
        wrapper,
        initialProps: { documents: initialDocuments },
      }
    );

    expect(result.current.hasPendingDocs).toBe(true);

    // 5秒経過してポーリングが開始される
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    // pendingドキュメントが完了した状態に更新
    const completedDocuments: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "completed.pdf",
        status: DocumentStatus.COMPLETED,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    rerender({ documents: completedDocuments });

    expect(result.current.hasPendingDocs).toBe(false);
    expect(result.current.pendingCount).toBe(0);

    // さらに5秒経過しても、ポーリングは停止しているため呼ばれない
    const callCountBefore = invalidateSpy.mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // 呼び出し回数が増えていないことを確認
    expect(invalidateSpy.mock.calls.length).toBe(callCountBefore);
  });

  it("5分経過するとタイムアウトしてポーリングが停止する", () => {
    const documents: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => usePendingDocumentsPolling(documents), {
      wrapper,
    });

    // 5分（300秒）経過 - この時点ではまだタイムアウトチェックは実行されない
    // 次のインターバル（5秒後）でタイムアウトチェックが実行される
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    // 5秒ごとに呼ばれるので、5分 = 300秒 / 5秒 = 60回
    expect(invalidateSpy).toHaveBeenCalledTimes(60);

    // さらに5秒経過して、次のインターバルでタイムアウトチェックが実行される
    // この時点でタイムアウトし、invalidateQueriesは呼ばれず、ポーリングが停止する
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // タイムアウト後はinvalidateQueriesが呼ばれない（60回のまま）
    expect(invalidateSpy).toHaveBeenCalledTimes(60);

    // タイムアウト後、さらに5秒経過しても呼ばれない
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(60);
  });

  it("タイムアウト後、pendingドキュメントが新しく追加されてもポーリングは再開されない", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const initialDocuments: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending1.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const { rerender } = renderHook(
      ({ documents }) => usePendingDocumentsPolling(documents),
      {
        wrapper,
        initialProps: { documents: initialDocuments },
      }
    );

    // 5分経過してタイムアウト
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    const callCountAtTimeout = invalidateSpy.mock.calls.length;

    // 新しいpendingドキュメントを追加
    const newDocuments: DocumentResponse[] = [
      ...initialDocuments,
      {
        documentId: "2",
        fileName: "pending2.pdf",
        status: DocumentStatus.PROCESSING,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 2000,
      },
    ];

    rerender({ documents: newDocuments });

    // さらに5秒経過しても、タイムアウト後のため呼ばれない
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy.mock.calls.length).toBe(callCountAtTimeout);
  });

  it("空の配列が渡された場合、hasPendingDocsはfalseを返す", () => {
    const { result } = renderHook(() => usePendingDocumentsPolling([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasPendingDocs).toBe(false);
    expect(result.current.pendingCount).toBe(0);
  });

  it("COMPLETED、FAILED、DELETEDステータスのドキュメントはpendingとしてカウントされない", () => {
    const documents: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "completed.pdf",
        status: DocumentStatus.COMPLETED,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
      {
        documentId: "2",
        fileName: "failed.pdf",
        status: DocumentStatus.FAILED,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 2000,
      },
      {
        documentId: "3",
        fileName: "deleted.pdf",
        status: DocumentStatus.DELETED,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 3000,
      },
    ];

    const { result } = renderHook(() => usePendingDocumentsPolling(documents), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasPendingDocs).toBe(false);
    expect(result.current.pendingCount).toBe(0);
  });

  it("ポーリング中にdocumentsがundefinedに変わった場合、ポーリングが停止する", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const initialDocuments: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const { result, rerender } = renderHook(
      ({ documents }) => usePendingDocumentsPolling(documents),
      {
        wrapper,
        initialProps: { documents: initialDocuments },
      }
    );

    expect(result.current.hasPendingDocs).toBe(true);

    // 5秒経過
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    // documentsがundefinedになる
    rerender({ documents: undefined as unknown as DocumentResponse[] });

    expect(result.current.hasPendingDocs).toBe(false);
    expect(result.current.pendingCount).toBe(0);

    // さらに5秒経過しても呼ばれない
    const callCountBefore = invalidateSpy.mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy.mock.calls.length).toBe(callCountBefore);
  });

  it("pendingドキュメントがなくなってから再度追加された場合、ポーリングが再開される", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const initialDocuments: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const { result, rerender } = renderHook(
      ({ documents }) => usePendingDocumentsPolling(documents),
      {
        wrapper,
        initialProps: { documents: initialDocuments },
      }
    );

    expect(result.current.hasPendingDocs).toBe(true);

    // 5秒経過
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    // pendingドキュメントが完了
    const completedDocuments: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "completed.pdf",
        status: DocumentStatus.COMPLETED,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    rerender({ documents: completedDocuments });

    expect(result.current.hasPendingDocs).toBe(false);

    // さらに5秒経過しても呼ばれない
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    // 新しいpendingドキュメントが追加される
    const newPendingDocuments: DocumentResponse[] = [
      ...completedDocuments,
      {
        documentId: "2",
        fileName: "new-pending.pdf",
        status: DocumentStatus.PROCESSING,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 2000,
      },
    ];

    rerender({ documents: newPendingDocuments });

    expect(result.current.hasPendingDocs).toBe(true);
    expect(result.current.pendingCount).toBe(1);

    // ポーリングが再開される（5秒経過）
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // 新しいポーリングが開始される（呼び出し回数が増える）
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });

  it("複数のpendingドキュメントのうち一部が完了しても、ポーリングは継続する", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const initialDocuments: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending1.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
      {
        documentId: "2",
        fileName: "pending2.pdf",
        status: DocumentStatus.PROCESSING,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 2000,
      },
    ];

    const { result, rerender } = renderHook(
      ({ documents }) => usePendingDocumentsPolling(documents),
      {
        wrapper,
        initialProps: { documents: initialDocuments },
      }
    );

    expect(result.current.hasPendingDocs).toBe(true);
    expect(result.current.pendingCount).toBe(2);

    // 5秒経過
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    // 1つ目のpendingドキュメントが完了
    const partialCompletedDocuments: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "completed1.pdf",
        status: DocumentStatus.COMPLETED,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
      {
        documentId: "2",
        fileName: "pending2.pdf",
        status: DocumentStatus.PROCESSING,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 2000,
      },
    ];

    rerender({ documents: partialCompletedDocuments });

    // まだpendingドキュメントが残っている
    expect(result.current.hasPendingDocs).toBe(true);
    expect(result.current.pendingCount).toBe(1);

    // さらに5秒経過すると、ポーリングが継続される
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });

  it("タイムアウト前に新しいpendingドキュメントが追加された場合、ポーリングが継続する", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const initialDocuments: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending1.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const { result, rerender } = renderHook(
      ({ documents }) => usePendingDocumentsPolling(documents),
      {
        wrapper,
        initialProps: { documents: initialDocuments },
      }
    );

    expect(result.current.hasPendingDocs).toBe(true);

    // 2分経過（タイムアウト前）
    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000);
    });

    // 2分 = 120秒 / 5秒 = 24回
    expect(invalidateSpy).toHaveBeenCalledTimes(24);

    // 新しいpendingドキュメントが追加される
    const newDocuments: DocumentResponse[] = [
      ...initialDocuments,
      {
        documentId: "2",
        fileName: "pending2.pdf",
        status: DocumentStatus.PROCESSING,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 2000,
      },
    ];

    rerender({ documents: newDocuments });

    expect(result.current.hasPendingDocs).toBe(true);
    expect(result.current.pendingCount).toBe(2);

    // さらに5秒経過すると、ポーリングが継続される
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(25);
  });

  it("DELETE_FAILEDステータスのドキュメントはpendingとしてカウントされない", () => {
    const documents: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "delete-failed.pdf",
        status: DocumentStatus.DELETE_FAILED,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const { result } = renderHook(() => usePendingDocumentsPolling(documents), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasPendingDocs).toBe(false);
    expect(result.current.pendingCount).toBe(0);
  });

  it("複数回のpendingドキュメントの追加・削除サイクルが正しく動作する", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // 1回目: pendingドキュメント追加
    const documents1: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending1.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const { result, rerender } = renderHook(
      ({ documents }) => usePendingDocumentsPolling(documents),
      {
        wrapper,
        initialProps: { documents: documents1 },
      }
    );

    expect(result.current.hasPendingDocs).toBe(true);

    // 5秒経過
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    // 2回目: pendingドキュメント完了
    const documents2: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "completed1.pdf",
        status: DocumentStatus.COMPLETED,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    rerender({ documents: documents2 });

    expect(result.current.hasPendingDocs).toBe(false);

    // さらに5秒経過しても呼ばれない
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    // 3回目: 新しいpendingドキュメント追加
    const documents3: DocumentResponse[] = [
      ...documents2,
      {
        documentId: "2",
        fileName: "pending2.pdf",
        status: DocumentStatus.PROCESSING,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 2000,
      },
    ];

    rerender({ documents: documents3 });

    expect(result.current.hasPendingDocs).toBe(true);

    // 5秒経過してポーリングが再開される
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });

  it("ポーリング開始直後（5秒未満）ではinvalidateQueriesが呼ばれない", () => {
    const documents: DocumentResponse[] = [
      {
        documentId: "1",
        fileName: "pending.pdf",
        status: DocumentStatus.PENDING_UPLOAD,
        tags: [],
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
        contentType: "application/pdf",
        fileSize: 1000,
      },
    ];

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => usePendingDocumentsPolling(documents), {
      wrapper,
    });

    // 4秒経過（5秒未満）
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    // まだ呼ばれない
    expect(invalidateSpy).not.toHaveBeenCalled();

    // さらに1秒経過して5秒になる
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // 初めて呼ばれる
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });
});
