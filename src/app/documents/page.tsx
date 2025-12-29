"use client";
import { useState } from "react";
import { Book, BookOpenText, Upload } from "lucide-react";

import RequireAuth from "@/features/auth/components/RequireAuth";
import DeleteConfirmDialog from "@/features/documents/components/DeleteConfirmDialog";
import DocumentDetailsModal from "@/features/documents/components/DocumentDetailsModal";
import DocumentSearchBar from "@/features/documents/components/DocumentSearchBar";
import DocumentTable from "@/features/documents/components/DocumentTable";
import FileUploadModal from "@/features/documents/components/FileUploadModal";
import { useDocumentDeleteActions } from "@/features/documents/hooks/useDocumentDeleteActions";
import { useDocumentFilters } from "@/features/documents/hooks/useDocumentFilters";
import { useDocuments } from "@/features/documents/hooks/useDocuments";
import { usePendingDocumentsPolling } from "@/features/documents/hooks/usePendingDocumentsPolling";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";

export default function DocumentsPage() {
  return (
    <RequireAuth>
      <Main />
    </RequireAuth>
  );
}

function Main() {
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  // 一覧の取得
  const { data, isLoading, refetch, isError, error } = useDocuments();
  useQueryErrorToast(isError, error);

  const { hasPendingDocs, pendingCount } = usePendingDocumentsPolling(
    data?.documents
  );

  // フィルタリングロジック
  const {
    filters,
    applied,
    filteredDocuments,
    allTags,
    tagSuggestions,
    actions: filterActions,
    hasConditions,
  } = useDocumentFilters(data?.documents ?? []);

  // 削除アクションロジック
  const { state: deleteState, actions: deleteActions } =
    useDocumentDeleteActions(refetch);

  // 削除対象のドキュメント取得（確認ダイアログ用）
  const targetDocument = (data?.documents ?? []).find(
    (d) => d.documentId === deleteState.confirmTargetId
  );

  return (
    <div className="h-full overflow-hidden">
      <div className="p-4 space-y-2 mx-auto md:max-w-6xl h-full flex flex-col">
        <div className="flex md:flex-row flex-col justify-between gap-2">
          {/* 検索バー */}
          <DocumentSearchBar
            filters={filters}
            applied={applied}
            actions={filterActions}
            hasConditions={hasConditions}
            tagSuggestions={tagSuggestions}
          />

          <div className="pb-2 pl-4 hidden md:block w-full max-w-[460px]">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant={"outline"}
                size="xs"
                onClick={() => setShowGuide((v) => !v)}
                className="ml-auto"
              >
                <div className="flex items-center gap-1">
                  {showGuide ? (
                    <>
                      <Book className="size-4" />
                      <Text variant="sm">説明を隠す</Text>
                    </>
                  ) : (
                    <>
                      <BookOpenText className="size-4" />
                      <Text variant="sm">説明書</Text>
                    </>
                  )}
                </div>
              </Button>
            </div>
            {showGuide && (
              <Text variant="sm" color="muted" leading="relaxed">
                この画面では、社内ドキュメントのアップロード・タグ付け・検索ができます。
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;1. ファイルをアップロード
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;2. タグを確認・調整
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;3. ファイル名やタグで検索
              </Text>
            )}
          </div>
        </div>

        {/* --- アップロードボタン --- */}
        <div className="space-y-3">
          <Text
            variant="sm"
            weight="semibold"
            color="default"
            className="border-t border-border pt-4"
          >
            新しいファイルをアップロード
          </Text>
          <Button
            variant="outlinePrimary"
            size="xs"
            className="group ml-2"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload className="size-4" />
            <Text variant="sm" as="span" className="group-hover:text-primary">
              ファイルをアップロード
            </Text>
          </Button>
          {showGuide && (
            <Text variant="sm" color="muted" className="ml-2">
              ボタンを押すと、ファイル選択とドラッグ＆ドロップに対応したアップロード用モーダルが開きます。
            </Text>
          )}
        </div>

        {/* --- ドキュメント一覧 --- */}
        <DocumentTable
          hasPendingDocs={hasPendingDocs}
          pendingCount={pendingCount}
          documents={filteredDocuments}
          loading={isLoading}
          onDelete={deleteActions.onDeleteClick}
          deletingId={deleteState.deletingId}
          onOpenDetails={(id) => setDetailId(id)}
          onTagClick={filterActions.selectTagFromTable}
          setConfirmTargetId={deleteActions.setConfirmTargetId}
          setShowBatchDeleteConfirm={deleteActions.setShowBatchDeleteConfirm}
          selectedIds={deleteState.selectedIds}
          onSelect={deleteActions.onSelect}
          onSelectAll={deleteActions.onSelectAll}
        />

        {showUploadModal && (
          <FileUploadModal
            showUploadModal={showUploadModal}
            setShowUploadModal={setShowUploadModal}
            refetch={refetch}
            showGuide={showGuide}
            allTags={allTags}
          />
        )}

        {detailId && (
          <DocumentDetailsModal
            documentId={detailId}
            onClose={() => setDetailId(null)}
          />
        )}

        <DeleteConfirmDialog
          isOpen={!!deleteState.confirmTargetId}
          onClose={() =>
            !deleteState.deletingId && deleteActions.setConfirmTargetId(null)
          }
          onConfirm={deleteActions.executeDelete}
          title={targetDocument?.fileName}
          isDeleting={
            !!deleteState.deletingId &&
            deleteState.deletingId === deleteState.confirmTargetId
          }
        />

        <DeleteConfirmDialog
          isOpen={deleteState.showBatchDeleteConfirm}
          onClose={() =>
            !deleteState.isBatchDeleting &&
            deleteActions.setShowBatchDeleteConfirm(false)
          }
          onConfirm={deleteActions.executeBatchDelete}
          count={deleteState.selectedIds.length}
          isDeleting={deleteState.isBatchDeleting}
        />
      </div>
    </div>
  );
}
