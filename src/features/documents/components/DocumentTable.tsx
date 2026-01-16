"use client";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Trash2 } from "lucide-react";

import StatusChip from "@/features/documents/components/StatusChip";
import TagList from "@/features/documents/components/TagList";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LightLoading from "@/components/ui/LightLoading";
import { Text } from "@/components/ui/Text";
import {
  type DocumentResponse,
  DocumentStatus,
} from "@/lib/api/generated/model";

const PAGE_SIZE = 20;

export default function DocumentTable({
  hasPendingDocs,
  pendingCount,
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
  hasPendingDocs: boolean;
  pendingCount: number;
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
  const [requestedPage, setRequestedPage] = useState(1);

  const totalCount = documents.length;
  const pageCount = totalCount === 0 ? 0 : Math.ceil(totalCount / PAGE_SIZE);

  // データ総数が減って現在のページが範囲外になった場合のみ、ページを補正する
  if (pageCount > 0 && requestedPage > pageCount) {
    setRequestedPage(pageCount);
  }

  // 有効なページ番号を計算
  const currentPage = useMemo(() => {
    if (pageCount === 0) return 1;
    return Math.max(1, Math.min(requestedPage, pageCount));
  }, [requestedPage, pageCount]);

  const paginatedDocuments = useMemo(() => {
    if (pageCount === 0) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return documents.slice(start, start + PAGE_SIZE);
  }, [documents, currentPage, pageCount]);

  // 全データの選択可能なドキュメントIDのみを抽出
  const allSelectableIds = useMemo(
    () =>
      documents
        .filter(
          (d) =>
            d.status !== DocumentStatus.PROCESSING &&
            d.status !== DocumentStatus.PENDING_UPLOAD
        )
        .map((d) => d.documentId),
    [documents]
  );

  // 選択可能なアイテムが全て選択されているかを確認
  const isAllSelected =
    allSelectableIds.length > 0 &&
    allSelectableIds.every((id) => selectedIds.includes(id));

  // 選択可能なアイテムの一部が選択されているかを確認
  const isIndeterminate =
    allSelectableIds.some((id) => selectedIds.includes(id)) && !isAllSelected;

  const canGoPrev = currentPage > 1;
  const canGoNext = pageCount > 0 && currentPage < pageCount;

  const goFirst = () => setRequestedPage(1);
  const goPrev = () => setRequestedPage((p) => p - 1);
  const goNext = () => setRequestedPage((p) => p + 1);
  const goLast = () => setRequestedPage(pageCount);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex md:items-center md:flex-row flex-col md:justify-between py-1.5 gap-2 shrink-0">
        <Text variant="sm" weight="semibold" color="default">
          アップロード済みファイル一覧
        </Text>
        {hasPendingDocs && (
          <Text
            variant="sm"
            weight="semibold"
            color="primary"
            className="flex items-center thinking-text-primary"
          >
            {pendingCount} 件のファイルを処理中
            <span className="loading-dots ml-0.5" />
          </Text>
        )}
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
                  aria-label="最初のページ"
                  variant="outline"
                  size="xs"
                  onClick={goFirst}
                  disabled={!canGoPrev}
                  title="最初のページ"
                >
                  {"<<"}
                </Button>
                <Button
                  aria-label="前のページ"
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
                  aria-label="次のページ"
                  variant="outline"
                  size="xs"
                  onClick={goNext}
                  disabled={!canGoNext}
                >
                  {">"}
                </Button>
                <Button
                  aria-label="最後のページ"
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
        className={`border rounded-md bg-white shadow-sm overflow-auto mb-4 relative`}
      >
        <table className="w-full text-sm min-w-[800px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 p-2 w-10 text-center border-b border-border bg-secondary">
                <Input
                  aria-label="全選択"
                  id="selectAllCheckbox"
                  type="checkbox"
                  size="checkbox"
                  checked={isAllSelected}
                  ref={(input: HTMLInputElement) => {
                    if (input) {
                      input.indeterminate = isIndeterminate;
                    }
                  }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (isIndeterminate) {
                      onSelectAll?.(allSelectableIds, false);
                    } else {
                      onSelectAll?.(allSelectableIds, e.target.checked);
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
                    <LightLoading />
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
                const isProcessing =
                  d.status === DocumentStatus.PROCESSING ||
                  d.status === DocumentStatus.PENDING_UPLOAD;
                return (
                  <tr key={d.documentId + index}>
                    <td className="p-2 text-center">
                      <Input
                        aria-label="選択"
                        id={`select-checkbox-${d.documentId + index}`}
                        type="checkbox"
                        size="checkbox"
                        checked={isSelected}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          onSelect?.(d.documentId, e.target.checked)
                        }
                        disabled={loading || isProcessing}
                      />
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <Text variant="md" color="default" className="truncate">
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
                          d.status === DocumentStatus.PROCESSING ||
                          d.status === DocumentStatus.PENDING_UPLOAD
                        }
                        onClick={() => onDelete?.(d.documentId)}
                        title={
                          d.status === DocumentStatus.PROCESSING ||
                          d.status === DocumentStatus.PENDING_UPLOAD
                            ? "処理中のため削除できません"
                            : "削除"
                        }
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
