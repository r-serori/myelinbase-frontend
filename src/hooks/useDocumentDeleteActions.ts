import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { getErrorMessage } from "@/lib/error-mapping";
import {
  useBatchDeleteDocuments,
  useDeleteDocument,
} from "@/hooks/useDocuments";
import { BatchDeleteRequestSchema } from "@/lib/schemas/document";

export function useDocumentDeleteActions(refetch: () => Promise<any>) {
  const { showToast } = useToast();
  const deleteDoc = useDeleteDocument();
  const batchDeleteDocs = useBatchDeleteDocuments();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // 単一削除
  const onDeleteClick = (documentId: string) => {
    setConfirmTargetId(documentId);
  };

  const executeDelete = async () => {
    if (!confirmTargetId) return;
    try {
      setDeletingId(confirmTargetId);
      await deleteDoc.mutateAsync(confirmTargetId);
      await refetch();
      showToast({ type: "success", message: "削除しました" });
      setConfirmTargetId(null);
      // 選択中のIDからも削除
      setSelectedIds(prev => prev.filter(id => id !== confirmTargetId));
    } catch (e) {
      showToast({ type: "error", message: getErrorMessage(e) });
    } finally {
      setDeletingId(null);
    }
  };

  // 選択
  const onSelect = (documentId: string, selected: boolean) => {
    if (selected) {
      setSelectedIds((prev) => [...prev, documentId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== documentId));
    }
  };

  const onSelectAll = (documentIds: string[], selected: boolean) => {
    if (selected) {
      const newSet = new Set([...selectedIds, ...documentIds]);
      setSelectedIds(Array.from(newSet));
    } else {
      const removeSet = new Set(documentIds);
      setSelectedIds((prev) => prev.filter((id) => !removeSet.has(id)));
    }
  };

  // 一括削除
  const executeBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    const result = BatchDeleteRequestSchema.safeParse({
      documentIds: selectedIds,
    });

    if (!result.success) {
      showToast({
        type: "error",
        message: "削除対象が正しく選択されていません。",
      });
      return;
    }

    try {
      setIsBatchDeleting(true);
      await batchDeleteDocs.mutateAsync(selectedIds);
      await refetch();
      setSelectedIds([]);
      setShowBatchDeleteConfirm(false);
      showToast({
        type: "success",
        message: `${selectedIds.length}件のドキュメントを削除しました`,
      });
    } catch (e) {
      showToast({ type: "error", message: getErrorMessage(e) });
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
      setDeletingId
    }
  };
}

