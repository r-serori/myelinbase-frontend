import { useState, useMemo } from "react";
import { DocumentResponse, DocumentStatus } from "@/lib/schemas/document";

import { parseTags } from "@/lib/utils";

export type FilterState = {
  filenameInput: string;
  tagsInput: string;
  isUntaggedInput: boolean;
  statusFilter: "ALL" | DocumentStatus;
  tagMode: "AND" | "OR";
  showTagSuggestions: boolean;
};

export type AppliedFilters = {
  filename?: string;
  tags: string[];
  isUntagged: boolean;
};

export function useDocumentFilters(documents: DocumentResponse[]) {
  // 入力中の状態
  const [filters, setFilters] = useState<FilterState>({
    filenameInput: "",
    tagsInput: "",
    isUntaggedInput: false,
    statusFilter: "ALL",
    tagMode: "AND",
    showTagSuggestions: false,
  });

  // 適用された検索条件
  const [applied, setApplied] = useState<AppliedFilters>({
    tags: [],
    isUntagged: false,
  });

  // Helper: 全タグの収集
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const d of documents) {
      (d.tags ?? []).forEach((t: string) => set.add(t));
    }
    return Array.from(set);
  }, [documents]);

  const normalizedAllTags = useMemo(
    () => Array.from(new Set(allTags.map((t) => t.trim()).filter((t) => t.length > 0))),
    [allTags]
  );

  // タグサジェスト
  const tagSuggestions = useMemo(() => {
    if (!filters.showTagSuggestions || normalizedAllTags.length === 0) return [];
    
    // 入力中のタグ配列（現在の入力欄に基づく）
    const currentInputTags = parseTags(filters.tagsInput);
    
    const availableTags = normalizedAllTags.filter(
      (t) => !currentInputTags.includes(t)
    );
    const parts = filters.tagsInput.split(",");
    const last = parts[parts.length - 1]?.trim().toLowerCase();
    
    if (!last) {
      return availableTags;
    }
    return availableTags.filter((tag) => tag.toLowerCase().includes(last));
  }, [filters.showTagSuggestions, filters.tagsInput, normalizedAllTags]);

  // アクション: 入力更新
  const setFilenameInput = (val: string) => setFilters(prev => ({ ...prev, filenameInput: val }));
  const setTagsInput = (val: string) => setFilters(prev => ({ ...prev, tagsInput: val }));
  const setIsUntaggedInput = (val: boolean) => setFilters(prev => ({ ...prev, isUntaggedInput: val }));
  const setStatusFilter = (val: "ALL" | DocumentStatus) => setFilters(prev => ({ ...prev, statusFilter: val }));
  const setTagMode = (val: "AND" | "OR") => setFilters(prev => ({ ...prev, tagMode: val }));
  const setShowTagSuggestions = (val: boolean) => setFilters(prev => ({ ...prev, showTagSuggestions: val }));

  // アクション: 検索実行
  const applyFilters = () => {
    setApplied({
      filename: filters.filenameInput.trim() || undefined,
      tags: parseTags(filters.tagsInput),
      isUntagged: filters.isUntaggedInput,
    });
  };

  // アクション: タグサジェスト選択
  const selectTagSuggestion = (tag: string) => {
    const parts = filters.tagsInput.split(",");
    let nextInput = "";
    
    if (parts.length <= 1) {
      nextInput = `${tag}, `;
    } else {
      const head = parts
        .slice(0, -1)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      head.push(tag);
      nextInput = `${head.join(", ")}, `;
    }
    setTagsInput(nextInput);
  };

  // アクション: テーブル内のタグクリック
  const selectTagFromTable = (tag: string) => {
    const parts = parseTags(filters.tagsInput);
    if (!parts.includes(tag)) {
      parts.push(tag);
    }
    const nextInput = parts.join(", ");
    
    setFilters(prev => ({
      ...prev,
      showTagSuggestions: false,
      tagsInput: nextInput,
      isUntaggedInput: false, // 未設定検索を解除
    }));
    
    // 即時適用
    setApplied(prev => ({
      ...prev,
      tags: parts,
      isUntagged: false,
      filename: filters.filenameInput.trim() || undefined, // ファイル名も現在の入力値で更新
    }));
  };

  // アクション: 条件クリア
  const clearFilename = () => {
    setFilenameInput("");
    setApplied(prev => ({ ...prev, filename: undefined }));
  };

  const clearTags = (tagToRemove?: string) => {
    if (!tagToRemove) {
      setTagsInput("");
      setApplied(prev => ({ ...prev, tags: [] }));
      return;
    }
    const nextTags = applied.tags.filter(t => t !== tagToRemove);
    setApplied(prev => ({ ...prev, tags: nextTags }));
    
    // Inputも同期して更新
    const inputParts = filters.tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0 && t !== tagToRemove);
    setTagsInput(inputParts.join(", "));
  };

  const clearUntagged = () => {
    setIsUntaggedInput(false);
    setApplied(prev => ({ ...prev, isUntagged: false }));
  };

  const clearStatus = () => {
    setStatusFilter("ALL");
  };

  const clearAll = () => {
    setFilters({
      filenameInput: "",
      tagsInput: "",
      isUntaggedInput: false,
      statusFilter: "ALL",
      tagMode: "AND",
      showTagSuggestions: false,
    });
    setApplied({
      tags: [],
      isUntagged: false,
      filename: undefined,
    });
  };

  // フィルタリング実行
  const filteredDocuments = useMemo(() => {
    let docs = documents;

    // ファイル名（部分一致）
    if (applied.filename) {
      const lower = applied.filename.toLowerCase();
      docs = docs.filter((d) => (d.fileName || "").toLowerCase().includes(lower));
    }

    // タグ
    if (applied.isUntagged) {
      docs = docs.filter((d) => !d.tags || d.tags.length === 0);
    } else if (applied.tags.length > 0) {
      docs = docs.filter((d) => {
        const docTags = (d.tags ?? []).map((t) => t.trim()).filter((t) => t.length > 0);
        if (docTags.length === 0) return false;
        if (filters.tagMode === "AND") {
          return applied.tags.every((t) => docTags.includes(t));
        }
        return applied.tags.some((t) => docTags.includes(t));
      });
    }

    // ステータス
    if (filters.statusFilter !== "ALL") {
      docs = docs.filter((d) => d.status === filters.statusFilter);
    }

    return docs;
  }, [documents, applied, filters.statusFilter, filters.tagMode]);

  const hasConditions = 
    !!applied.filename ||
    applied.tags.length > 0 ||
    applied.isUntagged ||
    filters.statusFilter !== "ALL";

  return {
    filters,
    applied,
    filteredDocuments,
    allTags,
    tagSuggestions,
    actions: {
      setFilenameInput,
      setTagsInput,
      setIsUntaggedInput,
      setStatusFilter,
      setTagMode,
      setShowTagSuggestions,
      applyFilters,
      selectTagSuggestion,
      selectTagFromTable,
      clearFilename,
      clearTags,
      clearUntagged,
      clearStatus,
      clearAll,
    },
    hasConditions
  };
}

