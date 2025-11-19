"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUpload } from "@/hooks/useUpload";
import { useDocumentStatus } from "@/hooks/useDocuments";
import { Upload } from "lucide-react";
import type { DocumentItem } from "@/lib/types";

type Preview =
  | { kind: "text"; name: string; size: number; mime: string; snippet: string }
  | { kind: "image"; name: string; size: number; mime: string; url: string }
  | { kind: "pdf"; name: string; size: number; mime: string; url: string }
  | { kind: "binary"; name: string; size: number; mime: string };

export default function UploadForm({
  onUploaded,
  showGuide,
  allTags,
}: {
  onUploaded?: (docs: DocumentItem[]) => void;
  showGuide?: boolean;
  allTags?: string[];
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState<number>(0);
  const [tagsInput, setTagsInput] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);
  const upload = useUpload();
  const { data: statusData } = useDocumentStatus(lastDocId || undefined);

  function parseTags(value: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const part of value.split(",")) {
      const v = part.trim();
      if (v && !seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    return out;
  }

  const currentTags = useMemo(() => parseTags(tagsInput), [tagsInput]);

  const normalizedAllTags = Array.from(
    new Set((allTags || []).map((t) => t.trim()).filter((t) => t.length > 0))
  );

  const tagSuggestions = (() => {
    if (!showTagSuggestions || normalizedAllTags.length === 0) return [];
    const availableTags = normalizedAllTags.filter(
      (t) => !currentTags.includes(t)
    );
    const parts = tagsInput.split(",");
    const last = parts[parts.length - 1]?.trim().toLowerCase();
    if (!last) {
      // 入力が空のときは全タグを表示（ただし未選択のもののみ）
      return availableTags;
    }
    return availableTags.filter((tag) => tag.toLowerCase().includes(last));
  })();

  useEffect(() => {
    // cleanup object URLs on unmount
    return () => {
      previews.forEach((p) => {
        if ((p.kind === "image" || p.kind === "pdf") && p.url) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buildPreviews(files: File[]) {
    const out: Preview[] = [];
    for (const f of files) {
      const mime = f.type || "application/octet-stream";
      if (mime.startsWith("text/") || mime === "application/json") {
        const text = await f.text();
        out.push({
          kind: "text",
          name: f.name,
          size: f.size,
          mime,
          snippet: text.slice(0, 2000),
        });
      } else if (mime.startsWith("image/")) {
        const url = URL.createObjectURL(f);
        out.push({ kind: "image", name: f.name, size: f.size, mime, url });
      } else if (mime === "application/pdf") {
        const url = URL.createObjectURL(f);
        out.push({ kind: "pdf", name: f.name, size: f.size, mime, url });
      } else {
        out.push({ kind: "binary", name: f.name, size: f.size, mime });
      }
    }
    setPreviews(out);
  }

  function addFiles(files: File[]) {
    if (!files.length) return;
    const next = [...selectedFiles, ...files];
    setSelectedFiles(next);
    buildPreviews(next);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    // ラップ要素から完全に離れたときのみ解除したいが、
    // シンプルに常に解除でも実用上問題ないためここではリセットする
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer?.files || []);
    addFiles(files);
  }

  function removeFile(name: string) {
    const next = selectedFiles.filter((f) => f.name !== name);
    setSelectedFiles(next);
    buildPreviews(next);
    if (fileRef.current && next.length === 0) {
      fileRef.current.value = "";
    }
  }

  function removeTagFromInput(tag: string) {
    const rest = currentTags.filter((t) => t !== tag);
    const next = rest.join(", ");
    // 次の入力がしやすいように、タグが残っていれば末尾に「, 」を付ける
    setTagsInput(next ? `${next}, ` : "");
  }
  function onSelectTagSuggestion(tag: string) {
    const parts = tagsInput.split(",");
    if (parts.length <= 1) {
      setTagsInput(`${tag}, `);
      return;
    }
    const head = parts
      .slice(0, -1)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (!head.includes(tag)) {
      head.push(tag);
    }
    const next = head.join(", ");
    setTagsInput(`${next}, `);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    setMessage(null);
    setMessageType(null);
    const parsedTags = currentTags;
    if (parsedTags.length === 0) {
      setMessage("タグを1つ以上入力してください。");
      setMessageType("error");
      return;
    }
    let lastId: string | null = null;
    const total = selectedFiles.length;
    setUploadingCount(selectedFiles.length);
    try {
      // 1リクエストで複数送信（Nest AnyFilesInterceptor対応）
      const res = (await upload.mutateAsync({
        files: selectedFiles,
        config:
          parsedTags.length > 0 ? { tags: parsedTags.join(", ") } : undefined,
      })) as any;
      if (Array.isArray(res?.results) && res.results.length > 0) {
        lastId = res.results[res.results.length - 1]?.documentId ?? null;
      } else if (res?.documentId) {
        // 後方互換（単一レスポンス）
        lastId = res.documentId;
      }
      if (lastId) {
        setLastDocId(lastId);
        // モック利用時のみ、フロント側で即時反映用の DocumentItem を生成して返す
        if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
          const now = new Date().toISOString();
          const mockDocs: DocumentItem[] = selectedFiles.map((file, index) => ({
            documentId: `local-${Date.now()}-${index}`,
            fileName: file.name,
            status: "PENDING",
            createdAt: now,
            tags: parsedTags,
            tagStatus: "PENDING",
          }));
          onUploaded?.(mockDocs);
        }
        setMessage(
          `${total}件のアップロードを受け付けました。タグ算出中です。しばらくしてからステータスをご確認ください。`
        );
        setMessageType("success");
      }
    } catch (err) {
      setMessage(
        "アップロードに失敗しました。時間をおいて再度お試しください。"
      );
      setMessageType("error");
    } finally {
      setUploadingCount(0);
      // clear
      setSelectedFiles([]);
      setPreviews([]);
      setTagsInput("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {showGuide && (
        <p className="text-xs text-gray-600">
          1. ファイルを選択 → 2. タグを入力（必須）→ 3.
          「アップロード」を押すと、後からタグでドキュメントを検索しやすくなります。
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-2">
        <div
          className={`flex flex-wrap items-center gap-3 border-2 border-dashed rounded px-3 py-2 transition-colors ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 bg-white"
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="flex flex-col gap-1">
            <input
              id="fileInput"
              ref={fileRef}
              type="file"
              multiple
              className="border rounded px-2 py-1 text-sm cursor-pointer hover:bg-gray-100"
              onChange={onFileChange}
            />
            <span className="text-[11px] text-gray-500">
              ファイルをここにドラッグ＆ドロップするか、「ファイルを選択」で指定してください。
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-start gap-3 w-full">
            <div className="flex-1 min-w-[220px] space-y-1">
              <label
                htmlFor="tagsInput"
                className="text-xs text-gray-600"
                title="アップロードしたファイルを分類するためのタグです。例: 就業規程, コンプライアンス。後からタグで検索・絞り込みできます。"
              >
                タグ（必須）
              </label>
              <div className="relative">
                <input
                  id="tagsInput"
                  type="text"
                  value={tagsInput}
                  onFocus={() => setShowTagSuggestions(true)}
                  onClick={() => setShowTagSuggestions(true)}
                  onChange={(e) => {
                    setShowTagSuggestions(true);
                    setTagsInput(e.target.value);
                  }}
                  onBlur={() => setShowTagSuggestions(false)}
                  className="border rounded px-2 py-1 text-sm w-full"
                  placeholder="例: 就業規則, コンプライアンス"
                />
                {tagSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded border bg-white shadow-sm text-xs">
                    {tagSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="w-full text-left px-2 py-1 hover:bg-gray-100"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onSelectTagSuggestion(tag);
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {currentTags.length > 0 && (
                <div className="mt-1 text-[11px] text-gray-600 flex flex-wrap items-center gap-1">
                  <span className="font-semibold">付与されるタグ:</span>
                  {currentTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-gray-50"
                    >
                      {tag}
                      <button
                        type="button"
                        className="text-[10px] text-gray-500 hover:text-gray-800"
                        onClick={() => removeTagFromInput(tag)}
                        aria-label={`${tag} を削除`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              className="border rounded px-3 py-1 flex items-center gap-1 cursor-pointer hover:bg-blue-600 bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 md:self-start md:mt-auto"
              disabled={upload.isPending || selectedFiles.length === 0}
            >
              <Upload className="w-4 h-4" />
              {uploadingCount > 0
                ? `アップロード中... (${uploadingCount}件残り)`
                : "アップロード"}
            </button>
          </div>
        </div>
        {lastDocId && (
          <span className="text-sm text-gray-600">
            最終アップロード: {statusData?.document?.fileName ?? lastDocId} /
            ステータス:{" "}
            {(() => {
              const code = statusData?.document?.status;
              if (code === "COMPLETED") return "完了";
              if (code === "PROCESSING") return "処理中";
              if (code === "PENDING") return "待機中";
              if (code === "ERROR") return "エラー";
              return "確認中...";
            })()}
          </span>
        )}
      </form>

      {message && (
        <div
          className={`text-xs mt-1 ${
            messageType === "error" ? "text-red-600" : "text-gray-700"
          }`}
        >
          {message}
        </div>
      )}

      {previews.length > 0 && (
        <div className="border rounded p-3 space-y-2">
          <div className="text-sm font-semibold">選択ファイルのプレビュー</div>
          <ul className="space-y-3">
            {previews.map((p) => (
              <li key={p.name} className="border rounded p-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{p.name}</span>{" "}
                    <span className="text-gray-500">
                      ({p.mime}, {(p.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    className="text-xs border rounded px-2 py-0.5"
                    onClick={() => removeFile(p.name)}
                  >
                    取消
                  </button>
                </div>
                {p.kind === "text" && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-blue-600">
                      内容を表示
                    </summary>
                    <pre className="mt-1 text-xs whitespace-pre-wrap break-words">
                      {p.snippet}
                    </pre>
                  </details>
                )}
                {p.kind === "image" && (
                  <img
                    src={p.url}
                    alt={p.name}
                    className="mt-2 max-h-40 rounded border"
                  />
                )}
                {p.kind === "pdf" && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-blue-600 underline"
                  >
                    PDFプレビューを開く
                  </a>
                )}
                {p.kind === "binary" && (
                  <div className="mt-2 text-xs text-gray-500">
                    プレビュー非対応の形式です
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
