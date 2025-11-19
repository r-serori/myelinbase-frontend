"use client";
import { useEffect, useMemo, useState } from "react";
import { useDocumentStatus, useUpdateDocumentTags } from "@/hooks/useDocuments";
import { Plus, RotateCcw, SendHorizonal } from "lucide-react";
import Spinner from "../ui/Spinner";
import { useToast } from "../ui/ToastProvider";

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
  const doc = data?.document;
  const [editTags, setEditTags] = useState<string[]>([]);
  const { showToast } = useToast();

  const statusUpdating = isLoading || isFetching;

  useEffect(() => {
    setEditTags(Array.isArray(doc?.tags) ? doc!.tags : []);
  }, [doc?.tags]);

  const statusInfo = useMemo(() => {
    const code = doc?.status;
    if (code === "COMPLETED") {
      return {
        label: "完了",
        className: "bg-green-100 text-green-700",
        description:
          "インデックス作成が完了し、このファイルは検索に利用できます。",
      };
    }
    if (code === "PROCESSING") {
      return {
        label: "処理中",
        className: "bg-yellow-100 text-yellow-700",
        description:
          "インデックスを作成中です。完了すると検索に利用できるようになります。",
      };
    }
    if (code === "PENDING") {
      return {
        label: "待機中",
        className: "bg-gray-100 text-gray-700",
        description:
          "キューに登録されています。しばらくすると処理が開始されます。",
      };
    }
    if (code === "ERROR") {
      return {
        label: "エラー",
        className: "bg-red-100 text-red-700",
        description:
          "処理に失敗しました。もう一度アップロードするか、管理者にお問い合わせください。",
      };
    }
    return {
      label: code ?? "不明",
      className: "bg-gray-100 text-gray-700",
      description: "",
    };
  }, [doc?.status]);

  function toggleTag(tag: string) {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function onSave() {
    if (!doc) return;
    if (editTags.length === 0) {
      alert("タグを1つ以上設定してください。");
      return;
    }
    try {
      await updateTags.mutateAsync({
        documentId: doc.documentId,
        tags: editTags,
        source: "USER",
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded shadow-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">ファイル詳細</h2>
          <button
            className="text-xs border rounded px-2 py-1"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
        <div className="mt-3 text-sm">
          {isLoading && <div className="text-gray-500">Loading...</div>}
          {!isLoading && doc && (
            <div className="space-y-2">
              <div>
                <span className="text-gray-500">ファイル名: </span>
                <span>{doc.fileName}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">ステータス: </span>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs ${statusInfo.className}`}
                    title={
                      doc?.status
                        ? `処理状態: ${statusInfo.label} (${doc.status})`
                        : undefined
                    }
                  >
                    {statusInfo.label}
                  </span>
                  <button
                    className="text-[11px] border rounded px-2 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                    onClick={async () => {
                      const result = await refetch();
                      if (result.error) {
                        showToast({
                          type: "error",
                          message:
                            "ステータスの取得に失敗しました。時間をおいて再度お試しください。",
                        });
                      } else {
                        showToast({
                          type: "success",
                          message: "ステータスを最新の情報に更新しました。",
                        });
                      }
                    }}
                    disabled={statusUpdating}
                  >
                    {statusUpdating ? (
                      <Spinner size="3" />
                    ) : (
                      <RotateCcw className={`w-3 h-3 text-gray-900`} />
                    )}
                    {statusUpdating ? "更新中..." : "ステータスを更新"}
                  </button>
                </div>
                {showGuide && statusInfo.description && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    {statusInfo.description}
                  </p>
                )}
              </div>
              <div>
                <span className="text-gray-500">作成日時: </span>
                <span>{new Date(doc.createdAt).toLocaleString()}</span>
              </div>
              {/* {doc.s3Path && (
                <div>
                  <span className="text-gray-500">s3Path: </span>
                  <span className="font-mono break-all">{doc.s3Path}</span>
                  <button
                    className="ml-2 text-xs border rounded px-2 py-0.5"
                    onClick={() => navigator.clipboard.writeText(doc.s3Path!)}
                  >
                    Copy
                  </button>
                </div>
              )} */}
              <div>
                <div className="text-gray-500">タグ:</div>
                {showGuide && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    一覧や検索で使用されるタグです。クリックすると除外できます。
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {editTags.map((t) => (
                    <button
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs"
                      onClick={() => toggleTag(t)}
                      title="クリックで除外"
                    >
                      {t}
                      <span className="ml-1 rounded bg-blue-200 text-blue-800 px-1 text-[10px]">
                        ×
                      </span>
                    </button>
                  ))}
                  <div className="flex flex-nowrap gap-1">
                    <input
                      id="newTagInput"
                      className="text-xs border rounded px-2 py-0.5"
                      placeholder="新規タグを入力してEnter"
                      onKeyDown={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const v = target.value.trim();
                          if (v && !editTags.includes(v)) {
                            setEditTags((p) => [...p, v]);
                          }
                          target.value = "";
                        }
                      }}
                    />
                    <button
                      id="addNewTagButton"
                      type="button"
                      className="text-[11px] border rounded px-1 py-0.5 flex items-center cursor-pointer hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                      onClick={() => {
                        const el = document.getElementById(
                          "newTagInput"
                        ) as HTMLInputElement | null;
                        if (!el) return;
                        const v = el.value.trim();
                        if (v && !editTags.includes(v)) {
                          setEditTags((p) => [...p, v]);
                        }
                        el.value = "";
                      }}
                    >
                      <Plus className="w-3 h-3 text-gray-900" />
                      追加
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <button
                  className="text-xs border rounded px-2 py-1 flex items-center gap-1 cursor-pointer hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                  onClick={onSave}
                  disabled={updateTags.isPending}
                >
                  {updateTags.isPending ? (
                    <Spinner size="3" />
                  ) : (
                    <>
                      <SendHorizonal className="w-3 h-3 text-gray-900" />
                    </>
                  )}
                  タグを更新
                </button>
                {showGuide && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    ※「タグを更新」を押すと、この画面で設定したタグが一覧と検索条件に反映されます。
                  </p>
                )}
              </div>
              <div className="text-xs text-gray-500">
                プレビューはS3の署名付きURLが必要です（将来対応）。
              </div>
            </div>
          )}
          {!isLoading && !doc && (
            <div className="text-gray-500">ドキュメントが見つかりません。</div>
          )}
        </div>
      </div>
    </div>
  );
}
