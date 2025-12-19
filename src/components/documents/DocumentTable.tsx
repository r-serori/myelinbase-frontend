"use client";
import { useEffect, useMemo, useState } from "react";
import type { DocumentItem } from "@/lib/types";

export default function DocumentTable({
  documents,
  loading,
  onDelete,
  deletingId,
  onOpenDetails,
  onTagClick,
}: {
  documents: DocumentItem[];
  loading?: boolean;
  onDelete?: (documentId: string) => void;
  deletingId?: string | null;
  onOpenDetails?: (documentId: string) => void;
  onTagClick?: (tag: string) => void;
}) {
  const PAGE_SIZE = 20;

  const [currentPage, setCurrentPage] = useState(1);

  const totalCount = documents.length;

  const pageCount = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.ceil(totalCount / PAGE_SIZE);
  }, [totalCount]);

  useEffect(() => {
    // ドキュメント一覧が変わった場合は 1 ページ目に戻す
    setCurrentPage(1);
  }, [totalCount]);

  useEffect(() => {
    // フィルタ変更などでページ数が減ったときに、存在する最後のページに戻す
    if (pageCount > 0 && currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const paginatedDocuments = useMemo(() => {
    if (pageCount === 0) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return documents.slice(start, start + PAGE_SIZE);
  }, [documents, currentPage, pageCount]);

  const canGoPrev = currentPage > 1;
  const canGoNext = pageCount > 0 && currentPage < pageCount;

  const goFirst = () => {
    if (!canGoPrev) return;
    setCurrentPage(1);
  };

  const goPrev = () => {
    if (!canGoPrev) return;
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const goNext = () => {
    if (!canGoNext) return;
    setCurrentPage((p) => Math.min(pageCount, p + 1));
  };

  const goLast = () => {
    if (!canGoNext) return;
    setCurrentPage(pageCount);
  };

  return (
    <div className="border rounded">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-2">ファイル名</th>
            <th className="p-2">ステータス</th>
            <th className="p-2">タグ</th>
            <th className="p-2">作成日時</th>
            <th className="p-2 w-48">操作</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td className="p-2 text-gray-500" colSpan={5}>
                Loading...
              </td>
            </tr>
          )}
          {!loading && documents.length === 0 && (
            <tr>
              <td className="p-2 text-gray-500 text-xs" colSpan={5}>
                ドキュメントがまだ登録されていません。上の「②
                新しいファイルをアップロード」からファイルを追加してください。
              </td>
            </tr>
          )}
          {!loading &&
            paginatedDocuments.map((d) => {
              const statusLabel =
                d.status === "COMPLETED"
                  ? "完了"
                  : d.status === "PROCESSING"
                  ? "処理中"
                  : d.status === "PENDING"
                  ? "待機中"
                  : "エラー";
              const statusTitle = `処理状態: ${statusLabel} (${d.status})`;
              return (
                <tr
                  key={d.documentId}
                  className={`border-t hover:bg-gray-50 ${
                    d.status === "PROCESSING"
                      ? "border-l-2 border-l-yellow-300"
                      : d.status === "ERROR"
                      ? "border-l-2 border-l-red-300"
                      : ""
                  }`}
                >
                  <td className="p-2">{d.fileName}</td>
                  <td className="p-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${
                        d.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : d.status === "PROCESSING"
                          ? "bg-yellow-100 text-yellow-700"
                          : d.status === "PENDING"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-red-100 text-red-700"
                      }`}
                      title={statusTitle}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {d.tags && d.tags.length > 0 ? (
                        <>
                          {d.tags.slice(0, 4).map((t) => {
                            return (
                              <button
                                type="button"
                                key={t}
                                className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs cursor-pointer hover:bg-blue-100"
                                title="クリックでこのタグで検索"
                                onClick={() => onTagClick?.(t)}
                              >
                                {t}
                              </button>
                            );
                          })}
                          {d.tags.length > 4 && (
                            <span className="text-xs text-gray-500">
                              +{d.tags.length - 4}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">
                          タグ未設定
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    {new Date(d.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="border rounded px-2 py-1 text-xs"
                        onClick={() => onOpenDetails?.(d.documentId)}
                      >
                        詳細
                      </button>
                      <button
                        className="border rounded px-2 py-1 text-xs"
                        onClick={() => onDelete?.(d.documentId)}
                        disabled={
                          !onDelete ||
                          deletingId === d.documentId ||
                          d.status === "PROCESSING"
                        }
                        title={
                          d.status === "PROCESSING"
                            ? "処理中は削除できません"
                            : "削除リクエスト"
                        }
                      >
                        {deletingId === d.documentId ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
      {!loading && totalCount > 0 && (
        <div className="flex flex-col gap-2 border-t px-3 py-2 text-xs text-gray-700 sm:flex-row items-center justify-end">
          <div className="text-right sm:text-left">
            {pageCount === 0
              ? "0/0 ページ"
              : `${currentPage}/${pageCount} ページ`}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goFirst}
              disabled={!canGoPrev}
              className="px-2 py-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {"<<"}
            </button>
            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev}
              className="px-2 py-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className="px-2 py-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              次へ
            </button>
            <button
              type="button"
              onClick={goLast}
              disabled={!canGoNext}
              className="px-2 py-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {">>"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
