"use client";
import { useEffect, useMemo, useState } from "react";
import type { DocumentResponse } from "@/lib/schemas/document";
import dayjs from "dayjs";
import TagList from "./TagList";
import { Button } from "../ui/Button";
import StatusChip from "./StatusChip";
import { Text } from "../ui/Text";
import Input from "../ui/Input";
import LightLoading from "../ui/LightLoading";
import { Trash2 } from "lucide-react";

export default function DocumentTable({
  documents,
  loading,
  onDelete,
  deletingId,
  onOpenDetails,
  setConfirmTargetId,
  setShowBatchDeleteConfirm,
  onTagClick,
  selectedIds = [],
  onSelect,
  onSelectAll,
}: {
  documents: DocumentResponse[];
  loading?: boolean;
  onDelete?: (documentId: string) => void;
  deletingId?: string | null;
  onOpenDetails?: (documentId: string) => void;
  setConfirmTargetId: (documentId: string) => void;
  setShowBatchDeleteConfirm: (show: boolean) => void;
  onTagClick?: (tag: string) => void;
  selectedIds?: string[];
  onSelect?: (documentId: string, selected: boolean) => void;
  onSelectAll?: (documentIds: string[], selected: boolean) => void;
}) {
  const PAGE_SIZE = 20;

  const [currentPage, setCurrentPage] = useState(1);

  const totalCount = documents.length;

  const pageCount = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.ceil(totalCount / PAGE_SIZE);
  }, [totalCount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [totalCount]);

  useEffect(() => {
    if (pageCount > 0 && currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const paginatedDocuments = useMemo(() => {
    if (pageCount === 0) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return documents.slice(start, start + PAGE_SIZE);
  }, [documents, currentPage, pageCount]);

  const allPageIds = useMemo(
    () => paginatedDocuments.map((d) => d.documentId),
    [paginatedDocuments]
  );
  const isAllSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id));
  const isIndeterminate =
    allPageIds.some((id) => selectedIds.includes(id)) && !isAllSelected;

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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex md:items-center md:flex-row flex-col md:justify-between py-1.5 gap-2 shrink-0">
        <Text variant="sm" weight="semibold" color="default">
          アップロード済みファイル一覧
        </Text>
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-8">
          {!loading && totalCount > 0 && (
            <div className="bg-background flex gap-2 text-xs sm:flex-row items-center justify-end">
              <div className="text-right sm:text-left mr-2">
                {totalCount} 件中{" "}
                {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalCount)} -{" "}
                {Math.min(currentPage * PAGE_SIZE, totalCount)} 件を表示
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={goFirst}
                  disabled={!canGoPrev}
                  title="最初のページ"
                >
                  {"<<"}
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={goPrev}
                  disabled={!canGoPrev}
                >
                  {"<"}
                </Button>
                <span className="mx-2 font-medium text-gray-800">
                  {currentPage} / {pageCount || 1}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={goNext}
                  disabled={!canGoNext}
                >
                  {">"}
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={goLast}
                  disabled={!canGoNext}
                  title="最後のページ"
                >
                  {">>"}
                </Button>
              </div>
            </div>
          )}
          <Button
            variant="destructive"
            size="xs"
            onClick={() =>
              selectedIds.length === 1
                ? setConfirmTargetId(selectedIds[0])
                : selectedIds.length > 1
                ? setShowBatchDeleteConfirm(true)
                : undefined
            }
            disabled={selectedIds.length === 0}
            className="ml-auto"
          >
            <Trash2 className="w-3 h-3" />
            <Text variant="sm" weight="semibold" color="white">
              {selectedIds.length > 0
                ? `選択した${selectedIds.length}件を削除`
                : "一括削除"}
            </Text>
          </Button>
        </div>
      </div>

      <div
        className={`border rounded-md bg-white shadow-sm overflow-auto mb-4 relative ${
          !loading && documents.length !== 0 && "flex-1"
        }`}
      >
        <table className="w-full text-sm min-w-[800px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 p-2 w-10 text-center border-b border-border bg-secondary">
                <Input
                  id="selectAllCheckbox"
                  type="checkbox"
                  size="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = isIndeterminate;
                    }
                  }}
                  onChange={(e) => {
                    if (isIndeterminate) {
                      onSelectAll?.(allPageIds, false);
                    } else {
                      onSelectAll?.(allPageIds, e.target.checked);
                    }
                  }}
                  disabled={loading || documents.length === 0}
                />
              </th>
              <th className="sticky top-0 z-10 p-2 font-medium text-gray-700 min-w-[150px] whitespace-nowrap border-b border-border bg-secondary text-left">
                ファイル名
              </th>
              <th className="sticky top-0 z-10 p-2 w-28 text-center font-medium text-gray-700 whitespace-nowrap border-b border-border bg-secondary">
                ステータス
              </th>
              <th className="sticky top-0 z-10 p-2 w-64 text-center font-medium text-gray-700 whitespace-nowrap border-b border-border bg-secondary">
                タグ
              </th>
              <th className="sticky top-0 z-10 p-2 w-36 text-center font-medium text-gray-700 whitespace-nowrap border-b border-border bg-secondary">
                作成日時
              </th>
              <th className="sticky top-0 z-10 p-2 w-36 text-center font-medium text-gray-700 whitespace-nowrap border-b border-border bg-secondary">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td className="p-8" colSpan={6}>
                  <div className="flex justify-center">
                    <LightLoading isLoading={!!loading} />
                  </div>
                </td>
              </tr>
            )}
            {!loading && documents.length === 0 && (
              <tr>
                <td className="p-8" colSpan={6}>
                  <Text variant="md" color="muted" className="text-center">
                    ドキュメントが見つかりませんでした。
                  </Text>
                </td>
              </tr>
            )}
            {!loading &&
              documents.length > 0 &&
              paginatedDocuments.map((d, index) => {
                const isSelected = selectedIds.includes(d.documentId);
                return (
                  <tr key={d.documentId + index}>
                    <td className="p-2 text-center">
                      <Input
                        id={`select-checkbox-${d.documentId + index}`}
                        type="checkbox"
                        size="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          onSelect?.(d.documentId, e.target.checked)
                        }
                        disabled={loading}
                      />
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <Text
                        variant="md"
                        color="default"
                        className="truncate"
                        title={d.fileName}
                      >
                        {d.fileName}
                      </Text>
                    </td>
                    <td className="p-2 text-center whitespace-nowrap">
                      <StatusChip status={d.status} />
                    </td>
                    <td className="p-2 text-center relative whitespace-nowrap">
                      <TagList tags={d.tags} onTagClick={onTagClick} />
                    </td>
                    <td className="p-2 text-center text-gray-600 text-xs whitespace-nowrap">
                      {dayjs(d.createdAt).format("YYYY/MM/DD HH:mm")}
                    </td>
                    <td className="flex gap-2 justify-center items-center p-2 whitespace-nowrap">
                      <Button
                        id={`open-details-button-${d.documentId + index}`}
                        variant="outlinePrimary"
                        size="xs"
                        onClick={() => onOpenDetails?.(d.documentId)}
                      >
                        詳細
                      </Button>
                      <Button
                        id={`delete-button-${d.documentId + index}`}
                        variant="destructive"
                        size="xs"
                        disabled={
                          !onDelete ||
                          deletingId === d.documentId ||
                          d.status === "PROCESSING"
                        }
                        onClick={() => onDelete?.(d.documentId)}
                        title="削除"
                      >
                        {deletingId === d.documentId ? "..." : "削除"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
