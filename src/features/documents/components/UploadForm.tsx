"use client";
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, FolderUp, Star, Upload } from "lucide-react";

import FilePreviewList, {
  Preview,
} from "@/features/documents/components/FilePreviewList";
import TagChip from "@/features/documents/components/TagChip";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILES,
  MAX_TAGS,
} from "@/features/documents/config/document-constants";
import { useFileSelection } from "@/features/documents/hooks/useFileSelection";
import { useUpload } from "@/features/documents/hooks/useUpload";
import Alert from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { DropdownItem, DropdownList } from "@/components/ui/DropDownList";
import Input from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { Text } from "@/components/ui/Text";
import Tooltip from "@/components/ui/Tooltip";
import type { DocumentResponse } from "@/lib/api/generated/model";
import { postDocumentsUploadBody } from "@/lib/api/generated/zod/default/default.zod";
import { handleCommonError } from "@/lib/error-handler";
import { parseTags } from "@/lib/utils";

import { useToast } from "@/providers/ToastProvider";

const ACCEPT_STRING = ALLOWED_EXTENSIONS.join(" ");

export default function UploadForm({
  onUploaded,
  allTags,
  existingFileNames = [],
}: {
  onUploaded?: (docs: DocumentResponse[]) => void;
  allTags?: string[];
  existingFileNames?: string[];
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const folderRef = useRef<HTMLInputElement | null>(null);

  // ファイル選択ロジック
  const {
    selectedFiles,
    previews,
    errorMessage,
    setErrorMessage,
    isProcessing,
    addFiles,
    removeFile,
    clearFiles,
    // 重複関連
    duplicateCount,
    uploadableFiles,
    fileHashes,
  } = useFileSelection();

  const [tagsInput, setTagsInput] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);
  const [previewingFile, setPreviewingFile] = useState<Preview | null>(null);

  const {
    uploadAsync,
    isPending: isUploading,
    progress: uploadProgress,
    clearProgress,
  } = useUpload();

  const { showToast } = useToast();

  const currentTags = useMemo(() => parseTags(tagsInput), [tagsInput]);
  const visibleTags = currentTags.slice(0, MAX_TAGS);
  const hiddenCount = currentTags.length - MAX_TAGS;
  const isOverLimit = currentTags.length > MAX_TAGS;

  const normalizedAllTags = Array.from(
    new Set((allTags || []).map((t) => t.trim()).filter((t) => t.length > 0))
  );

  // サーバー上のファイル名セットをメモ化
  const existingRemoteFileNames = useMemo(
    () => new Set(existingFileNames),
    [existingFileNames]
  );

  const tagSuggestions = (() => {
    if (!showTagSuggestions || normalizedAllTags.length === 0) return [];
    const availableTags = normalizedAllTags.filter(
      (t) => !currentTags.includes(t)
    );
    const parts = tagsInput.split(",");
    const last = parts[parts.length - 1]?.trim().toLowerCase();
    if (!last) {
      return availableTags;
    }
    return availableTags.filter((tag) => tag.toLowerCase().includes(last));
  })();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    // 結果表示中に新しいファイルを追加した場合、前回の結果とファイルをクリア
    const shouldClear = Object.keys(uploadProgress).length > 0;
    if (shouldClear) {
      clearProgress();
    }
    addFiles(files, existingRemoteFileNames, { clearExisting: shouldClear });
    e.target.value = "";
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    // 結果表示中に新しいファイルを追加した場合、前回の結果とファイルをクリア
    const shouldClear = Object.keys(uploadProgress).length > 0;
    if (shouldClear) {
      clearProgress();
    }
    const files = Array.from(e.dataTransfer?.files || []);
    addFiles(files, existingRemoteFileNames, { clearExisting: shouldClear });
  }

  // アップロード結果表示中かどうか（重複再計算スキップ判定用）
  const hasUploadProgress = Object.keys(uploadProgress).length > 0;

  function handleRemoveFile(name: string) {
    if (isUploading) return;
    // アップロード完了後の削除時は重複再計算をスキップ（チカチカ防止）
    removeFile(name, { skipDuplicateRecalc: hasUploadProgress });
  }

  function removeTagFromInput(tag: string) {
    if (isUploading) return;
    const rest = currentTags.filter((t) => t !== tag);
    const next = rest.join(", ");
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
    setErrorMessage(null);

    // アップロード対象がない場合
    if (uploadableFiles.length === 0) {
      setErrorMessage("アップロード可能なファイルがありません。");
      return;
    }

    const validationTarget = {
      files: uploadableFiles.map((f) => ({
        fileName: f.name,
        contentType: f.type || "application/octet-stream",
        fileSize: f.size,
      })),
      tags: currentTags,
    };

    try {
      postDocumentsUploadBody.parse(validationTarget);

      // 重複を除外したファイルのみアップロード
      // ハッシュ情報も渡す
      const result = await uploadAsync({
        files: uploadableFiles,
        tags: currentTags,
        fileHashes, // 既に計算済みのハッシュを渡す
      });

      // 結果メッセージを構築
      const messages: string[] = [];

      if (result.successCount > 0) {
        messages.push(`${result.successCount}件アップロード完了`);
      }

      // フロントエンド重複（選択時に除外）
      if (duplicateCount > 0) {
        messages.push(`${duplicateCount}件は選択時に除外`);
      }

      // バックエンド重複（既存ファイルと重複）
      if (result.backendDuplicateCount > 0) {
        messages.push(`${result.backendDuplicateCount}件は既存ファイルと重複`);
      }

      // その他エラー
      if (result.otherErrorCount > 0) {
        messages.push(`${result.otherErrorCount}件はエラー`);
      }

      const hasErrors =
        result.backendDuplicateCount > 0 || result.otherErrorCount > 0;

      // 結果に応じてトーストの種類を決定
      if (result.successCount > 0) {
        onUploaded?.([]);
        showToast({
          type: hasErrors ? "warning" : "success",
          message: messages.join("、"),
        });

        // 全成功時のみ自動クリア
        if (!hasErrors) {
          setTimeout(() => {
            clearFiles();
            clearProgress();
            setTagsInput("");

            if (fileRef.current) fileRef.current.value = "";
          }, 2000);
        }
      } else if (result.backendDuplicateCount > 0) {
        // 全てバックエンド重複
        showToast({
          type: "error",
          message: `全ファイルが既存ファイルと重複しています（${result.backendDuplicateCount}件）`,
        });
      }
    } catch (err: unknown) {
      handleCommonError(
        err,
        setErrorMessage,
        showToast,
        "ファイルのアップロードに失敗しました。"
      );
    }
  }

  // 手動クリアハンドラー
  function handleClearForm() {
    clearFiles();
    clearProgress();

    setTagsInput("");

    if (fileRef.current) fileRef.current.value = "";
  }

  // アップロード結果表示中
  const isShowingResults = Object.keys(uploadProgress).length > 0;

  // 結果表示中でもファイル追加を許可（追加時に結果をクリア）
  const isDropzoneDisabled = isProcessing || isUploading;

  return (
    <div>
      <form onSubmit={onSubmit}>
        <Input
          id="fileInput"
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPT_STRING}
          className="hidden"
          onChange={onFileChange}
        />
        <input
          id="folderInput"
          ref={folderRef}
          type="file"
          multiple
          // @ts-expect-error - webkitdirectory is not supported in all browsers
          webkitdirectory=""
          directory=""
          className="hidden"
          onChange={onFileChange}
        />

        <div
          className={`
            relative flex flex-col items-center justify-center gap-3 
            border-2 border-dashed border-border rounded-lg p-6 transition-all
            ${
              isDropzoneDisabled
                ? "cursor-wait pointer-events-none opacity-80"
                : "cursor-pointer"
            }
            ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-border bg-muted/20 hover:bg-accent"
            }
          `}
          onDragOver={!isDropzoneDisabled ? onDragOver : undefined}
          onDragLeave={!isDropzoneDisabled ? onDragLeave : undefined}
          onDrop={!isDropzoneDisabled ? onDrop : undefined}
          onClick={() => !isDropzoneDisabled && fileRef.current?.click()}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Spinner size="6" color="foreground" />
              <div className="flex items-center gap-1">
                <Text variant="md" color="muted">
                  ファイルを処理中...
                </Text>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center shrink-0 size-8 rounded-full bg-primary/10">
                <Upload
                  className={`size-4 ${
                    isDragging ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="text-center space-y-1">
                {isShowingResults ? (
                  <Text
                    variant="md"
                    color="muted"
                    leading="relaxed"
                    className="text-center"
                  >
                    クリックしてファイルを追加 または ドラッグ＆ドロップ
                    <br />
                    （前回の結果はクリアされます）
                  </Text>
                ) : (
                  <Text variant="md" color="muted" leading="relaxed">
                    クリックしてファイルを選択 または ドラッグ＆ドロップ
                    <br />
                    対応形式: {ALLOWED_EXTENSIONS.join("  ")}
                    (最大 50MB / {MAX_FILES}件まで)
                  </Text>
                )}
              </div>
            </>
          )}

          <div className="absolute bottom-1 right-1">
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={isDropzoneDisabled}
              onClick={(e) => {
                e.stopPropagation();
                folderRef.current?.click();
              }}
            >
              <FolderUp className="size-3.5 mr-1" />
              フォルダを選択
            </Button>
          </div>
        </div>

        {errorMessage && (
          <Alert color="destructive">
            <Text
              variant="md"
              color="destructive"
              leading="relaxed"
              className="whitespace-pre-wrap"
            >
              {errorMessage}
            </Text>
          </Alert>
        )}

        <>
          {selectedFiles.length > 0 && (
            <div className="bg-background border rounded-lg p-4 shadow-sm mt-2">
              <div className="pb-2">
                <div className="flex flex-col md:flex-row md:items-start gap-4 pb-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 pb-1">
                      <Text
                        htmlFor="uploadFormTagsInput"
                        as="label"
                        variant="md"
                        color="muted"
                        weight="semibold"
                        className="flex items-center relative"
                      >
                        タグ
                      </Text>
                      <Tooltip position="top-0 left-8" circleSize={5}>
                        <div className="space-y-1">
                          <Text
                            variant="md"
                            weight="semibold"
                            className="flex items-center gap-1 pb-1"
                          >
                            <Star className="size-4" />
                            おすすめの方法:
                          </Text>
                          <Text variant="md" weight="medium" leading="relaxed">
                            ExplorerまたはFinderのパスを入力することで、ファイルを管理しやすくなります。
                          </Text>
                          <Text variant="md" weight="medium" leading="relaxed">
                            例:
                            <br /> ・パスが下記のファイルを選択した場合:
                            <br />
                            &nbsp;&nbsp;&nbsp;&nbsp;xxx\MyelinBase\社内資料\20251214就業規則.pdf
                            <br />
                            ・タグ入力欄に下記を入力:
                            <br />
                            &nbsp;&nbsp;&nbsp;&nbsp;MyelinBase, 社内資料,
                            就業規則
                          </Text>
                        </div>
                      </Tooltip>
                    </div>
                    <div className="relative">
                      <Input
                        id="uploadFormTagsInput"
                        size="md"
                        type="text"
                        value={tagsInput}
                        onFocus={() => setShowTagSuggestions(true)}
                        onChange={(e) => {
                          setShowTagSuggestions(true);
                          setTagsInput(e.target.value);
                        }}
                        onBlur={() =>
                          setTimeout(() => setShowTagSuggestions(false), 200)
                        }
                        className={`${
                          isOverLimit && "border-warning"
                        } md:w-full`}
                        placeholder="例: 就業規則, 議事録 (カンマ区切りで複数可)"
                        disabled={isUploading}
                      />
                      {showTagSuggestions && tagSuggestions.length > 0 && (
                        <DropdownList size="md">
                          {tagSuggestions.map((tag, index) => (
                            <DropdownItem
                              key={tag + index}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                onSelectTagSuggestion(tag);
                              }}
                            >
                              {tag}
                            </DropdownItem>
                          ))}
                        </DropdownList>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isOverLimit && (
                <Alert color="warning" className="mb-3 mt-0">
                  <Text variant="sm" color="warning" weight="medium">
                    タグの上限（{MAX_TAGS}個）を超えています。
                    更新するにはタグを減らしてください。
                  </Text>
                </Alert>
              )}

              {currentTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {visibleTags.map((tag) => (
                    <TagChip
                      isDeleted={!isUploading}
                      key={tag}
                      tag={tag}
                      onClick={() => removeTagFromInput(tag)}
                    />
                  ))}
                  {hiddenCount > 0 && (
                    <Text
                      variant="sm"
                      color="warning"
                      weight="medium"
                      className="inline-flex items-center gap-1"
                    >
                      <AlertTriangle className="size-3" />+{hiddenCount}
                    </Text>
                  )}
                </div>
              )}

              <div className="flex justify-end shrink-0 mb-2">
                <Button
                  id="uploadButton"
                  size="sm"
                  type="submit"
                  className={`${
                    isUploading ||
                    isOverLimit ||
                    (uploadableFiles.length === 0 &&
                      "bg-primary/70 cursor-not-allowed hover:bg-primary/70")
                  }`}
                  disabled={
                    isUploading ||
                    isProcessing ||
                    uploadableFiles.length === 0 ||
                    isOverLimit
                  }
                >
                  {isUploading ? (
                    <Spinner size="3.5" color="background" />
                  ) : (
                    <Upload className="size-3.5" />
                  )}
                  <Text
                    variant="sm"
                    color="white"
                    weight="semibold"
                    as="span"
                    className={isUploading ? "thinking-text-button" : ""}
                  >
                    {isUploading
                      ? "アップロード中..."
                      : duplicateCount > 0
                        ? `アップロード開始 (${uploadableFiles.length}件)`
                        : "アップロード開始"}
                  </Text>
                </Button>
              </div>

              <FilePreviewList
                previews={previews}
                onRemove={handleRemoveFile}
                onPreviewClick={setPreviewingFile}
                selectedFilesCount={selectedFiles.length}
                duplicateCount={duplicateCount}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
                onClearAll={handleClearForm}
              />
            </div>
          )}
        </>
      </form>

      {previewingFile && (
        <Modal
          size="3xl"
          isOpen={!!previewingFile}
          title={previewingFile.name}
          onClose={() => setPreviewingFile(null)}
        >
          {previewingFile.kind === "text" && (
            <div className="border border-border rounded-lg p-2 h-[70vh] overflow-y-auto custom-scrollbar flex flex-col bg-gray-50/30">
              <pre className="w-full text-sm font-mono whitespace-pre-wrap break-all text-foreground">
                {previewingFile.snippet}
              </pre>
              {previewingFile.snippet.length >= 2000 && (
                <Text
                  variant="sm"
                  color="muted"
                  className="mt-2 text-center border-t pt-2"
                >
                  --- 先頭 2000 文字のみ表示しています ---
                </Text>
              )}
            </div>
          )}
          {previewingFile.kind === "pdf" && (
            <div className="flex flex-col gap-3">
              <iframe
                key={previewingFile.url}
                src={previewingFile.url}
                className="w-full h-[65vh] rounded border shadow-sm bg-white"
                title="PDF Preview"
              />

              <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
                <Text variant="sm" color="muted">
                  プレビューが表示されない場合:
                </Text>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => window.open(previewingFile.url, "_blank")}
                >
                  新しいタブで開く
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
