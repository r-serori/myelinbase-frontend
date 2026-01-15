"use client";
import { useState } from "react";
import dayjs from "dayjs";
import {
  AlertTriangle,
  FileDown,
  Info,
  Plus,
  SendHorizonal,
} from "lucide-react";

import StatusChip from "@/features/documents/components/StatusChip";
import TagChip from "@/features/documents/components/TagChip";
import { MAX_TAGS } from "@/features/documents/config/document-constants";
import {
  useDocumentById,
  useGetDocumentDownloadUrl,
  useUpdateDocumentTags,
} from "@/features/documents/hooks/useDocuments";
import Alert from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import LightLoading from "@/components/ui/LightLoading";
import { Modal } from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { Text } from "@/components/ui/Text";
import type { DocumentResponse } from "@/lib/api/generated/model";
import { patchDocumentsIdTagsBody } from "@/lib/api/generated/zod/default/default.zod";
import { handleCommonError } from "@/lib/error-handler";

import { useToast } from "@/providers/ToastProvider";
interface DocumentDetailsContentProps {
  doc: DocumentResponse;
  refetch: () => Promise<unknown>;
}

function DocumentDetailsContent({ doc, refetch }: DocumentDetailsContentProps) {
  const { showToast } = useToast();
  const updateTags = useUpdateDocumentTags();
  const getDownloadUrl = useGetDocumentDownloadUrl();

  const [editTags, setEditTags] = useState<string[]>(doc.tags ?? []);
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isOverLimit = editTags.length > MAX_TAGS;

  function toggleTag(tag: string) {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleAddTag() {
    const v = inputValue.trim();
    if (v && !editTags.includes(v)) {
      setEditTags((p) => [...p, v]);
      setInputValue("");
    }
  }

  async function onSave() {
    try {
      patchDocumentsIdTagsBody.parse({ tags: editTags });

      await updateTags.mutateAsync({
        documentId: doc.documentId,
        tags: editTags,
      });
      setErrorMessage("");
      await refetch();
      showToast({
        type: "success",
        message: "タグを更新しました。",
      });
    } catch (err: unknown) {
      handleCommonError(
        err,
        setErrorMessage,
        showToast,
        "タグの更新に失敗しました。時間をおいて再度お試しください。"
      );
    }
  }

  async function onOpenPreview() {
    try {
      const { downloadUrl } = await getDownloadUrl.mutateAsync(doc.documentId);
      let targetUrl = downloadUrl;
      if (targetUrl.includes("localstack")) {
        targetUrl = targetUrl.replace("localstack", "localhost");
      }
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } catch {
      showToast({
        type: "error",
        message: "プレビュー用URLの取得に失敗しました。",
      });
    }
  }

  return (
    <div>
      <div className="grid grid-cols-[100px_1fr] gap-y-4 items-start space-y-2">
        <Text variant="md" color="muted" weight="medium" className="py-1">
          ファイル名
        </Text>
        <Text
          variant="md"
          color="default"
          weight="medium"
          className="break-all py-1"
        >
          {doc.fileName}
        </Text>

        <Text variant="md" color="muted" weight="medium" className="py-1">
          ステータス
        </Text>
        <div className="flex items-center gap-2">
          <StatusChip status={doc.status} className="pt-1" />
          <Text variant="sm" color="muted" weight="medium">
            {(doc.status === "PROCESSING" || doc.status === "PENDING_UPLOAD") &&
              "ステータスが「完了」になると、チャットで参照可能なファイルになります。"}
          </Text>
        </div>

        <Text variant="md" color="muted" weight="medium">
          作成日時
        </Text>
        <Text variant="sm" color="default" weight="medium" className="pt-0.5">
          {dayjs(doc.createdAt).format("YYYY/MM/DD HH:mm")}
        </Text>
      </div>

      {errorMessage && <Alert color="destructive">{errorMessage}</Alert>}

      <div className="py-5 space-y-3">
        <div className="flex items-center justify-between">
          <Text
            variant="md"
            color="default"
            weight="semibold"
            className="flex items-center gap-2"
          >
            タグ設定
            <Text
              variant="xs"
              color="muted"
              weight="normal"
              className="bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100"
              as="span"
            >
              {editTags.length}個
            </Text>
          </Text>
        </div>

        <div className="bg-gray-50/50 rounded-lg border border-gray-200 p-4 space-y-4">
          <div>
            {editTags.length === 0 ? (
              <Text
                variant="sm"
                color="muted"
                weight="medium"
                className="flex items-center gap-1"
              >
                <Info className="size-3" />
                タグはまだ設定されていません
              </Text>
            ) : (
              <div className="flex flex-wrap gap-2">
                {editTags.map((t) => (
                  <TagChip
                    key={t}
                    tag={t}
                    isDeleted={true}
                    onClick={toggleTag}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {isOverLimit && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-2.5 rounded-md border border-amber-200">
                <AlertTriangle className="size-4 shrink-0" />
                <Text variant="sm" color="muted" weight="medium">
                  タグの上限（{MAX_TAGS}個）を超えています。
                  更新するにはタグを減らしてください。
                </Text>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
              <div className="flex gap-2 w-full sm:max-w-xs">
                <Input
                  id="documentDetailsModalTagsInput"
                  size="sm"
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setInputValue(e.target.value)
                  }
                  placeholder="新しいタグを入力..."
                  className={`${isOverLimit && "border-warning"}`}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  disabled={isOverLimit || updateTags.isPending}
                  autoComplete="off"
                />
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleAddTag}
                  disabled={
                    isOverLimit || updateTags.isPending || !inputValue.trim()
                  }
                >
                  <Plus className="size-3.5" />
                  追加
                </Button>
              </div>

              <Button
                variant="default"
                size="xs"
                onClick={onSave}
                disabled={
                  updateTags.isPending ||
                  isOverLimit ||
                  editTags.map((t) => t.toLowerCase()).join(",") ===
                    doc.tags?.map((t) => t.toLowerCase()).join(",")
                }
              >
                {updateTags.isPending ? (
                  <Spinner size="3" />
                ) : (
                  <SendHorizonal className="size-3" />
                )}
                <Text
                  variant="sm"
                  color="white"
                  className={updateTags.isPending ? "thinking-text-button" : ""}
                >
                  タグを保存
                </Text>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {doc.status === "COMPLETED" ? (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="xs"
            onClick={onOpenPreview}
            disabled={getDownloadUrl.isPending}
          >
            {getDownloadUrl.isPending ? (
              <Spinner size="3" />
            ) : (
              <FileDown className="size-3" />
            )}
            <Text
              variant="sm"
              color="default"
              className={getDownloadUrl.isPending ? "thinking-text" : ""}
            >
              ファイルを開く（プレビュー/ダウンロード）
            </Text>
          </Button>
        </div>
      ) : (
        <Text
          variant="sm"
          color="muted"
          weight="medium"
          className="text-center"
        >
          ※ 処理が完了するまでプレビュー機能は利用できません
        </Text>
      )}
    </div>
  );
}

export default function DocumentDetailsModal({
  documentId,
  onClose,
}: {
  documentId: string;
  onClose: () => void;
}) {
  const { data, isLoading, refetch } = useDocumentById(documentId);
  const doc = data?.document;

  return (
    <Modal
      isOpen={true}
      title="ファイル詳細"
      size="2xl"
      onClose={onClose}
      aria-label="ファイル詳細モーダル"
    >
      <div className="text-sm">
        {isLoading && (
          <div className="flex justify-center items-center py-12 text-gray-500 gap-2">
            <LightLoading />
          </div>
        )}

        {!isLoading && doc && (
          <DocumentDetailsContent
            key={doc.documentId}
            doc={doc}
            refetch={refetch}
          />
        )}

        {!isLoading && !doc && (
          <div className="flex flex-col items-center py-12">
            <AlertTriangle className="size-8 mb-2 text-warning" />
            <Text variant="lg" color="warning" weight="medium">
              ドキュメントが見つかりませんでした。
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
}
