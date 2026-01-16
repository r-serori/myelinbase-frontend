import { useState } from "react";

import { MAX_BATCH_DELETE } from "@/features/documents/config/document-constants";
import {
  useBatchDeleteDocuments,
  useDeleteDocument,
} from "@/features/documents/hooks/useDocuments";
import { ErrorResponse } from "@/lib/api/generated/model";
import { handleCommonError } from "@/lib/error-handler";
import { getErrorMessage } from "@/lib/error-mapping";

import { useToast } from "@/providers/ToastProvider";

export function useDocumentDeleteActions(refetch: () => Promise<unknown>) {
  const { showToast } = useToast();
  const deleteDoc = useDeleteDocument();
  const batchDeleteDocs = useBatchDeleteDocuments();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  const onDeleteClick = (documentId: string) => {
    setConfirmTargetId(documentId);
  };

  const executeDelete = async () => {
    if (!confirmTargetId) return;
    try {
      setDeletingId(confirmTargetId);
      await deleteDoc.mutateAsync(confirmTargetId);
      setConfirmTargetId(null);
      setSelectedIds((prev) => prev.filter((id) => id !== confirmTargetId));
      showToast({ type: "success", message: "削除しました" });
      await refetch();
    } catch (err: unknown) {
      showToast({
        type: "error",
        message: getErrorMessage((err as ErrorResponse).errorCode),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const onSelect = (documentId: string, selected: boolean) => {
    if (selected) {
      // 上限チェック
      if (selectedIds.length >= MAX_BATCH_DELETE) {
        showToast({
          type: "warning",
          message: `一度に選択できるのは${MAX_BATCH_DELETE}件までです`,
        });
        return;
      }
      setSelectedIds((prev) => [...prev, documentId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== documentId));
    }
  };

  const onSelectAll = (documentIds: string[], selected: boolean) => {
    if (selected) {
      const currentSet = new Set(selectedIds);
      const newIds = documentIds.filter((id) => !currentSet.has(id));
      const totalAfterAdd = selectedIds.length + newIds.length;

      // 上限チェック
      if (totalAfterAdd > MAX_BATCH_DELETE) {
        const canAdd = MAX_BATCH_DELETE - selectedIds.length;
        if (canAdd <= 0) {
          showToast({
            type: "warning",
            message: `一度に選択できるのは${MAX_BATCH_DELETE}件までです`,
          });
          return;
        }
        // 追加可能な分だけ追加
        const idsToAdd = newIds.slice(0, canAdd);
        setSelectedIds((prev) => [...prev, ...idsToAdd]);
        showToast({
          type: "warning",
          message: `一度に選択できるのは${MAX_BATCH_DELETE}件までです（${canAdd}件追加しました）`,
        });
        return;
      }

      const newSet = new Set([...selectedIds, ...documentIds]);
      setSelectedIds(Array.from(newSet));
    } else {
      const removeSet = new Set(documentIds);
      setSelectedIds((prev) => prev.filter((id) => !removeSet.has(id)));
    }
  };

  const executeBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    // 上限チェック（念のため）
    if (selectedIds.length > MAX_BATCH_DELETE) {
      showToast({
        type: "error",
        message: `一度に削除できるのは${MAX_BATCH_DELETE}件までです`,
      });
      return;
    }

    try {
      setIsBatchDeleting(true);
      await batchDeleteDocs.mutateAsync(selectedIds);

      setShowBatchDeleteConfirm(false);
      setSelectedIds([]);
      showToast({
        type: "success",
        message: `${selectedIds.length}件のドキュメントを削除しました`,
      });
      await refetch();
    } catch (err: unknown) {
      handleCommonError(
        err as ErrorResponse,
        (message) => {
          showToast({
            type: "error",
            message,
          });
        },
        showToast,
        "ドキュメントの一括削除に失敗しました。"
      );
    } finally {
      setIsBatchDeleting(false);
    }
  };

  return {
    state: {
      deletingId,
      confirmTargetId,
      selectedIds,
      showBatchDeleteConfirm,
      isBatchDeleting,
    },
    actions: {
      setConfirmTargetId,
      setShowBatchDeleteConfirm,
      onDeleteClick,
      executeDelete,
      onSelect,
      onSelectAll,
      executeBatchDelete,
      setDeletingId,
    },
  };
}
