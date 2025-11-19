"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import DocumentTable from "@/components/documents/DocumentTable";
import { useDeleteDocument, useDocuments } from "@/hooks/useDocuments";
import { useMemo, useState } from "react";
import DocumentDetailsModal from "@/components/documents/DocumentDetailsModal";
import { Book, BookOpenText, Search } from "lucide-react";
import FileUploadModal from "@/components/documents/FileUploadModal";
import type { DocumentItem } from "@/lib/types";

export default function DocumentsPage() {
  return (
    <RequireAuth>
      <Main />
    </RequireAuth>
  );
}

function Main() {
  // 入力中の値
  const [filenameInput, setFilenameInput] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);
  // 実際に検索に使われている値（searchボタン押下時に反映）
  const [appliedFilename, setAppliedFilename] = useState<string | undefined>(
    undefined
  );
  const [appliedTags, setAppliedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "COMPLETED" | "PROCESSING" | "PENDING" | "ERROR"
  >("ALL");
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [tagMode, setTagMode] = useState<"AND" | "OR">("AND");

  // 一覧の取得は常に全件（ownerIdフィルタのみ）として、フィルタリングはフロント側で実施
  const { data, isLoading, refetch } = useDocuments();

  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

  // フロント側で追加したモックドキュメント（モック利用時のみ使用）
  const [localDocuments, setLocalDocuments] = useState<DocumentItem[]>([]);

  // バックエンドからの一覧 + フロント側モックのマージ
  const baseDocuments = useMemo(() => {
    const apiDocs = data?.documents ?? [];
    if (!useMocks) return apiDocs;
    if (localDocuments.length === 0) return apiDocs;
    const byId = new Map<string, DocumentItem>();
    for (const d of apiDocs) byId.set(d.documentId, d);
    for (const d of localDocuments) {
      if (!byId.has(d.documentId)) {
        byId.set(d.documentId, d);
      }
    }
    return Array.from(byId.values());
  }, [data?.documents, localDocuments, useMocks]);

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

  // 一覧から得られる全タグ（候補）
  const allTags = useMemo(() => {
    const docs = baseDocuments;
    const set = new Set<string>();
    for (const d of docs) {
      (d.tags ?? []).forEach((t) => set.add(t));
    }
    return Array.from(set);
  }, [baseDocuments]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const deleteDoc = useDeleteDocument();
  async function onDelete(documentId: string) {
    if (!confirm("削除リクエストを送信します。よろしいですか？")) return;
    try {
      setDeletingId(documentId);
      await deleteDoc.mutateAsync(documentId);
      await refetch();
    } finally {
      setDeletingId(null);
    }
  }

  // タグ入力の最後のセグメントに対するサジェスト
  const tagSuggestions = useMemo(() => {
    if (!showTagSuggestions) return [];
    const raw = tagsInput.trim();
    if (!raw) {
      // 入力が空の場合は全タグを表示
      return allTags;
    }
    const parts = raw.split(",");
    const last = parts[parts.length - 1]?.trim().toLowerCase();
    if (!last) return allTags;
    return allTags.filter((tag) => tag.toLowerCase().includes(last));
  }, [tagsInput, allTags, showTagSuggestions]);

  function onSelectTagSuggestion(tag: string) {
    const parts = tagsInput.split(",");
    if (parts.length <= 1) {
      // 単一タグの場合はそのままセットし、次の入力用にカンマ+スペースを付与
      setTagsInput(`${tag}, `);
      return;
    }
    const head = parts
      .slice(0, -1)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    head.push(tag);
    const next = head.join(", ");
    setTagsInput(`${next}, `);
  }

  function onSearch() {
    const nextFilename = filenameInput.trim();
    setAppliedFilename(nextFilename || undefined);
    const nextTags = parseTags(tagsInput);
    setAppliedTags(nextTags);
  }

  // フロント側でのフィルタ適用後の一覧
  const filteredDocuments = useMemo(() => {
    let docs = baseDocuments;

    // ファイル名（部分一致）
    if (appliedFilename && appliedFilename.trim()) {
      const lower = appliedFilename.trim().toLowerCase();
      docs = docs.filter((d) =>
        (d.fileName || "").toLowerCase().includes(lower)
      );
    }

    // タグ（AND / OR 条件）
    if (appliedTags.length > 0) {
      docs = docs.filter((d) => {
        const docTags = (d.tags ?? [])
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        if (docTags.length === 0) return false;
        if (tagMode === "AND") {
          return appliedTags.every((t) => docTags.includes(t));
        }
        // OR
        return appliedTags.some((t) => docTags.includes(t));
      });
    }

    // ステータス
    if (statusFilter !== "ALL") {
      docs = docs.filter((d) => d.status === statusFilter);
    }

    return docs;
  }, [baseDocuments, appliedFilename, appliedTags, tagMode, statusFilter]);

  function onTagClickFromTable(tag: string) {
    // 既存タグ入力に追加し、そのまま検索条件にも反映
    const parts = parseTags(tagsInput);
    if (!parts.includes(tag)) {
      parts.push(tag);
    }
    const nextInput = parts.join(", ");
    // テーブルからのクリック時はサジェストを表示しない
    setShowTagSuggestions(false);
    setTagsInput(nextInput);
    setAppliedTags(parts);
    const nextFilename = filenameInput.trim();
    setAppliedFilename(nextFilename || undefined);
  }

  const hasConditions =
    !!appliedFilename || appliedTags.length > 0 || statusFilter !== "ALL";

  function clearFilenameCondition() {
    setFilenameInput("");
    setAppliedFilename(undefined);
  }

  function clearTagCondition(tag?: string) {
    if (!tag) {
      setAppliedTags([]);
      setTagsInput("");
      return;
    }
    const next = appliedTags.filter((t) => t !== tag);
    setAppliedTags(next);
    const inputParts = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t !== tag);
    setTagsInput(inputParts.join(", "));
  }

  function clearStatusCondition() {
    setStatusFilter("ALL");
  }

  function clearAllConditions() {
    setFilenameInput("");
    setTagsInput("");
    setAppliedFilename(undefined);
    setAppliedTags([]);
    setStatusFilter("ALL");
    setTagMode("AND");
  }

  return (
    <div className="p-4 space-y-4 mx-auto md:max-w-6xl">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold">ドキュメント管理</h1>
          <button
            type="button"
            className="text-[11px] border rounded px-2 py-1 text-gray-700 hover:bg-gray-100 ml-2 cursor-pointer"
            onClick={() => setShowGuide((v) => !v)}
          >
            {showGuide ? (
              <div className="flex items-center gap-1">
                <Book className="w-4 h-4" />
                {"説明を隠す"}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <BookOpenText className="w-4 h-4" />
                {"説明書"}
              </div>
            )}
          </button>
        </div>
        {showGuide && (
          <p className="text-xs text-gray-600 leading-relaxed">
            この画面では、社内ドキュメントのアップロード・タグ付け・検索ができます。
            <br />
            基本フロー: ①ファイルをアップロード → ②タグを確認・調整 →
            ③ファイル名やタグで検索
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-700">
          ① アップロード済みファイルを検索
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">ファイル名</label>
            <input
              value={filenameInput}
              onChange={(e) => setFilenameInput(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              placeholder="例: 規定, rules"
            />
          </div>
          {showGuide && (
            <span className="text-[11px] text-gray-500 md:ml-2">
              ※部分一致で検索できます
            </span>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">タグ</label>
            <div className="relative">
              <input
                value={tagsInput}
                onFocus={() => setShowTagSuggestions(true)}
                onClick={() => setShowTagSuggestions(true)}
                onChange={(e) => {
                  setShowTagSuggestions(true);
                  setTagsInput(e.target.value);
                }}
                onBlur={() => setShowTagSuggestions(false)}
                className="border rounded px-2 py-1 text-sm"
                placeholder="例: 会社規定, 労働基準"
              />
              {tagSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-48 max-h-40 overflow-y-auto rounded border bg-white shadow-sm text-xs">
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
          </div>
          {showGuide && (
            <span className="text-[11px] text-gray-500 md:ml-2">
              ※カンマ区切りで複数タグを指定できます（例: 「コンプライアンス,
              規程」）
            </span>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">ステータス</label>
              <select
                className="border rounded px-2 py-1 text-xs"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
              >
                <option value="ALL">すべて</option>
                <option value="COMPLETED">完了のみ</option>
                <option value="PROCESSING">処理中のみ</option>
                <option value="PENDING">待機中のみ</option>
                <option value="ERROR">エラーのみ</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-700">
              <span>タグ条件</span>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="tagMode"
                  value="AND"
                  checked={tagMode === "AND"}
                  onChange={() => {
                    setTagMode("AND");
                    onSearch();
                  }}
                />
                <span>AND</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="tagMode"
                  value="OR"
                  checked={tagMode === "OR"}
                  onChange={() => {
                    setTagMode("OR");
                    onSearch();
                  }}
                />
                <span>OR</span>
              </label>
            </div>
            <button
              id="search-btn"
              className="border rounded-md p-1.5 hover:bg-gray-200 cursor-pointer"
              type="button"
              onClick={onSearch}
              title="検索を実行"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
        {hasConditions && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 mt-1">
            <span className="font-semibold">現在の条件:</span>
            {appliedFilename && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-gray-50">
                <span>ファイル名: {appliedFilename}</span>
                <button
                  type="button"
                  className="ml-1 text-gray-500 hover:text-gray-800"
                  onClick={clearFilenameCondition}
                  aria-label="ファイル名条件をクリア"
                >
                  ×
                </button>
              </span>
            )}
            {appliedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-gray-50"
              >
                <span>タグ: {tag}</span>
                <button
                  type="button"
                  className="ml-1 text-gray-500 hover:text-gray-800"
                  onClick={() => clearTagCondition(tag)}
                  aria-label={`タグ条件 ${tag} をクリア`}
                >
                  ×
                </button>
              </span>
            ))}
            {appliedTags.length > 1 && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-gray-50">
                <span>
                  タグ条件:{" "}
                  {tagMode === "AND" ? "すべて含む (AND)" : "いずれか含む (OR)"}
                </span>
              </span>
            )}
            {statusFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 bg-gray-50">
                <span>
                  ステータス:{" "}
                  {statusFilter === "COMPLETED"
                    ? "完了"
                    : statusFilter === "PROCESSING"
                    ? "処理中"
                    : statusFilter === "PENDING"
                    ? "待機中"
                    : "エラー"}
                </span>
                <button
                  type="button"
                  className="ml-1 text-gray-500 hover:text-gray-800"
                  onClick={clearStatusCondition}
                  aria-label="ステータス条件をクリア"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              className="ml-1 text-[11px] text-blue-600 hover:underline"
              onClick={clearAllConditions}
            >
              すべてクリア
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-700">
          ② 新しいファイルをアップロード
        </div>
        <button
          type="button"
          className="border rounded px-3 py-1 text-xs cursor-pointer hover:bg-gray-100"
          onClick={() => setShowUploadModal(true)}
        >
          ファイルをアップロード
        </button>
        {showGuide && (
          <p className="text-[11px] text-gray-500">
            ボタンを押すと、ファイル選択とドラッグ＆ドロップに対応したアップロード用モーダルが開きます。
          </p>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-700">
          ③ アップロード済みファイル一覧
        </div>
        <DocumentTable
          documents={filteredDocuments}
          loading={isLoading}
          onDelete={onDelete}
          deletingId={deletingId}
          onOpenDetails={(id) => setDetailId(id)}
          onTagClick={onTagClickFromTable}
        />
      </div>

      {showUploadModal && (
        <FileUploadModal
          showUploadModal={showUploadModal}
          setShowUploadModal={setShowUploadModal}
          refetch={refetch}
          showGuide={showGuide}
          allTags={allTags}
          onAppendDocuments={
            useMocks
              ? (docs) => setLocalDocuments((prev) => [...docs, ...prev])
              : undefined
          }
        />
      )}

      {detailId && (
        <DocumentDetailsModal
          documentId={detailId}
          showGuide={showGuide}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
