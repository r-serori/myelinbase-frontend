"use client";
import { useEffect, useState } from "react";
import {
  useDocumentStatus,
  useUpdateDocumentTags,
  useGetDocumentDownloadUrl,
} from "@/hooks/useDocuments";
import {
  Plus,
  X,
  AlertTriangle,
  FileDown,
  Info,
  SendHorizonal,
} from "lucide-react";
import Spinner from "../ui/Spinner";
import { useToast } from "../ui/ToastProvider";
import dayjs from "dayjs";
import { UpdateTagsRequestSchema } from "@/lib/schemas/document";
import { Button } from "../ui/Button";
import StatusChip from "./StatusChip";
import TagChip from "./TagChip";
import { Text } from "../ui/Text";
import Input from "../ui/Input";
import { Modal } from "../ui/Modal";

export default function DocumentDetailsModal({
  documentId,
  onClose,
  showGuide,
}: {
  documentId: string;
  onClose: () => void;
  showGuide?: boolean;
}) {
  const { data, isLoading, isFetching, refetch } =
    useDocumentStatus(documentId);
  const updateTags = useUpdateDocumentTags();
  const getDownloadUrl = useGetDocumentDownloadUrl();
  const doc = data?.document;

  // タグリストの管理
  const [editTags, setEditTags] = useState<string[]>([]);
  // 新しいタグ入力の管理（DOM直接参照をやめ、State管理に変更）
  const [inputValue, setInputValue] = useState("");

  const { showToast } = useToast();

  const statusUpdating = isLoading || isFetching;
  const MAX_TAGS_COUNT = 20;
  const isOverLimit = editTags.length > MAX_TAGS_COUNT;

  useEffect(() => {
    setEditTags(Array.isArray(doc?.tags) ? doc!.tags : []);
  }, [doc?.tags]);

  function toggleTag(tag: string) {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // タグを追加する処理（共通化）
  function handleAddTag() {
    const v = inputValue.trim();
    if (v && !editTags.includes(v)) {
      setEditTags((p) => [...p, v]);
      setInputValue(""); // 追加後にリセット
    }
  }

  async function onSave() {
    if (!doc) return;

    const result = UpdateTagsRequestSchema.safeParse({ tags: editTags });

    if (!result.success) {
      const firstError = result.error.issues[0];
      showToast({
        type: "error",
        message: firstError.message || "タグの設定が不正です。",
      });
      return;
    }

    try {
      await updateTags.mutateAsync({
        documentId: doc.documentId,
        tags: editTags,
      });
      await refetch();
      showToast({
        type: "success",
        message: "タグを更新しました。",
      });
    } catch (e) {
      showToast({
        type: "error",
        message: "タグの更新に失敗しました。時間をおいて再度お試しください。",
      });
    }
  }
  async function onOpenPreview() {
    if (!doc) return;
    try {
      const { downloadUrl } = await getDownloadUrl.mutateAsync(doc.documentId);
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      showToast({
        type: "error",
        message: "プレビュー用URLの取得に失敗しました。",
      });
    }
  }

  return (
    <Modal isOpen={true} title="ファイル詳細" size="2xl" onClose={onClose}>
      <div className="text-sm">
        {isLoading && (
          <div className="flex justify-center items-center py-12 text-gray-500 gap-2">
            <Spinner size="4" />
            <Text variant="sm" color="default" weight="medium">
              データを読み込んでいます...
            </Text>
          </div>
        )}

        {!isLoading && doc && (
          <div>
            {/* 基本情報セクション */}
            <div className="grid grid-cols-[100px_1fr] gap-y-4 items-start space-y-2">
              {/* ファイル名 */}
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

              {/* ステータス */}
              <Text variant="md" color="muted" weight="medium" className="py-1">
                ステータス
              </Text>
              <div className="flex items-center gap-2">
                <StatusChip status={doc.status} className="pt-1" />
                <Text variant="sm" color="muted" weight="medium">
                  {(doc.status === "PROCESSING" ||
                    doc.status === "PENDING_UPLOAD") &&
                    "ステータスが「完了」になると、チャットで参照可能なファイルになります。"}
                </Text>
              </div>

              {/* 作成日時 */}
              <Text variant="md" color="muted" weight="medium">
                作成日時
              </Text>
              <Text
                variant="sm"
                color="default"
                weight="medium"
                className="pt-0.5"
              >
                {dayjs(doc.createdAt).format("YYYY/MM/DD HH:mm")}
              </Text>
            </div>

            {/* タグ編集セクション */}
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
                {/* 設定済みタグ一覧 */}
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

                {/* 入力フォーム */}
                <div className="space-y-3">
                  {isOverLimit && (
                    <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-2.5 rounded-md border border-amber-200">
                      <AlertTriangle className="size-4 shrink-0" />
                      <Text variant="sm" color="muted" weight="medium">
                        タグの上限（{MAX_TAGS_COUNT}個）を超えています。
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
                        onKeyDown={(
                          e: React.KeyboardEvent<HTMLInputElement>
                        ) => {
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
                          isOverLimit ||
                          updateTags.isPending ||
                          !inputValue.trim()
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
                        editTags.length === 0
                      }
                    >
                      {updateTags.isPending ? (
                        <Spinner size="3" />
                      ) : (
                        <SendHorizonal className="size-3" />
                      )}
                      <Text variant="sm" color="white">
                        タグを保存
                      </Text>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* フッターアクション（プレビュー） */}
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
                  <Text variant="sm" color="default">
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
        )}

        {!isLoading && !doc && (
          <div className="flex flex-col items-center  py-12">
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
