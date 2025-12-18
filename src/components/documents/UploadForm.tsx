"use client";
import { useMemo, useRef, useState } from "react";
import { useUpload, UploadProgress } from "@/hooks/useUpload";
import { useDocumentStatus } from "@/hooks/useDocuments";
import { Upload, AlertTriangle, Star, FolderUp } from "lucide-react";
import {
  DocumentResponse,
  UploadRequestRequestSchema,
  ALLOWED_EXTENSIONS,
} from "@/lib/schemas/document";
import { getErrorMessage } from "@/lib/error-mapping";
import { useToast } from "../ui/ToastProvider";
import Spinner from "../ui/Spinner";
import { Button } from "../ui/Button";
import { cn, parseTags } from "@/lib/utils";
import { Text } from "../ui/Text";
import Input from "../ui/Input";
import { DropdownItem, DropdownList } from "../ui/DropDownList";
import TagChip from "./TagChip";
import Alert from "../ui/Alert";
import Tooltip from "../ui/ToolTip";
import { Modal } from "../ui/Modal";
import FilePreviewList, { Preview } from "./FilePreviewList";
import { useFileSelection } from "@/hooks/useFileSelection";

const MAX_DISPLAY_TAGS = 20;
const ACCEPT_STRING = ALLOWED_EXTENSIONS.join(" ");

export default function UploadForm({
  onUploaded,
  allTags,
}: {
  onUploaded?: (docs: DocumentResponse[]) => void;
  allTags?: string[];
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const folderRef = useRef<HTMLInputElement | null>(null);

  // ファイル選択ロジック
  const {
    selectedFiles,
    previews,
    errorMessage,
    setErrorMessage,
    addFiles,
    removeFile,
    clearFiles,
  } = useFileSelection();

  const [tagsInput, setTagsInput] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);
  const [previewingFile, setPreviewingFile] = useState<Preview | null>(null);
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, UploadProgress>
  >({});

  const { showToast } = useToast();
  const { uploadAsync, isPending } = useUpload();

  const currentTags = useMemo(() => parseTags(tagsInput), [tagsInput]);
  const visibleTags = currentTags.slice(0, MAX_DISPLAY_TAGS);
  const hiddenCount = currentTags.length - MAX_DISPLAY_TAGS;
  const isOverLimit = currentTags.length > MAX_DISPLAY_TAGS;

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
      return availableTags;
    }
    return availableTags.filter((tag) => tag.toLowerCase().includes(last));
  })();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    addFiles(files);
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
    const files = Array.from(e.dataTransfer?.files || []);
    addFiles(files);
  }

  function handleRemoveFile(name: string) {
    removeFile(name);
    const nextProgress = { ...uploadProgress };
    delete nextProgress[name];
    setUploadProgress(nextProgress);
  }

  function removeTagFromInput(tag: string) {
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

    const validationTarget = {
      files: selectedFiles.map((f) => ({
        fileName: f.name,
        contentType: f.type || "application/octet-stream",
        fileSize: f.size,
      })),
      tags: currentTags,
    };

    const result = UploadRequestRequestSchema.safeParse(validationTarget);

    if (!result.success) {
      const issues = result.error.issues;
      const tagError = issues.find((i) => i.path[0] === "tags");

      if (tagError) {
        if (tagError.code === "too_big") {
          setErrorMessage(
            `タグの数が多すぎます（上限${MAX_DISPLAY_TAGS}個）。`
          );
        } else {
          setErrorMessage(tagError.message || "タグが不正です。");
        }
      } else if (issues.some((i) => i.path[0] === "files")) {
        const hasExtensionError = issues.some(
          (i) =>
            i.path.includes("fileName") && i.message === "UNSUPPORTED_EXTENSION"
        );

        if (selectedFiles.length === 0) {
          setErrorMessage("ファイルを選択してください。");
        } else if (hasExtensionError) {
          setErrorMessage(
            `許可されていないファイル形式が含まれています。(${ALLOWED_EXTENSIONS.join(
              ", "
            )})`
          );
        } else {
          const detailed = issues
            .map((i) => i.message)
            .filter(
              (m) => m !== "UNSUPPORTED_EXTENSION" && m !== "Required"
            )[0];
          setErrorMessage(detailed || "ファイル情報が不正です。");
        }
      } else {
        setErrorMessage("入力内容に不備があります。");
      }
      return;
    }

    const initialProgress: Record<string, UploadProgress> = {};
    selectedFiles.forEach((f) => {
      initialProgress[f.name] = {
        fileName: f.name,
        status: "pending",
        progress: 0,
      };
    });
    setUploadProgress(initialProgress);

    try {
      const res = await uploadAsync({
        files: selectedFiles,
        tags: currentTags,
      });

      if (res.length > 0) {
        const completedProgress: Record<string, UploadProgress> = {};
        selectedFiles.forEach((f) => {
          completedProgress[f.name] = {
            fileName: f.name,
            status: "completed",
            progress: 100,
          };
        });
        setUploadProgress(completedProgress);

        onUploaded?.([]);
        showToast({ type: "success", message: "アップロードが完了しました" });

        setTimeout(() => {
          clearFiles();
          setTagsInput("");
          setUploadProgress({});
          if (fileRef.current) fileRef.current.value = "";
        }, 3000);
      }
    } catch (err: any) {
      const friendlyMessage = getErrorMessage(err);
      showToast({ type: "error", message: friendlyMessage });

      const errorProgress: Record<string, UploadProgress> = {};
      selectedFiles.forEach((f) => {
        errorProgress[f.name] = {
          fileName: f.name,
          status: "error",
          progress: 0,
        };
      });
      setUploadProgress(errorProgress);
    }
  }

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
          // @ts-ignore
          webkitdirectory=""
          directory=""
          className="hidden"
          onChange={onFileChange}
        />
        <div
          className={`
            relative flex flex-col items-center justify-center gap-3 
            border-2 border-dashed border-border rounded-lg p-6 transition-all cursor-pointer
            ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-border bg-muted/20 hover:bg-accent"
            }
          `}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="bg-background p-3 rounded-full shadow-sm">
            <Upload
              className={`size-6 ${
                isDragging ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
          <div className="text-center space-y-1">
            <Text variant="md" color="muted" leading="relaxed">
              クリックしてファイルを選択 または ドラッグ＆ドロップ
              <br />
              対応形式: {ALLOWED_EXTENSIONS.join("  ")} (最大 50MB)
            </Text>
          </div>

          <div className="absolute bottom-2 right-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
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
              weight="medium"
              leading="relaxed"
            >
              {errorMessage}
            </Text>
          </Alert>
        )}

        {selectedFiles.length > 0 && (
          <div className="bg-background border rounded-lg p-4 shadow-sm">
            <div className="pb-4">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1 space-y-2">
                  <Text
                    htmlFor="uploadFormTagsInput"
                    as="label"
                    variant="md"
                    color="muted"
                    weight="semibold"
                    className="flex gap-2 items-center relative"
                  >
                    タグ
                    <Text variant="xs" color="muted" weight="normal" as="span">
                      任意
                    </Text>
                    <Tooltip position="top-0 left-24" circleSize={5}>
                      <div className="space-y-1">
                        <Text
                          variant="md"
                          weight="semibold"
                          className="flex items-center gap-1"
                        >
                          <Star className="size-4" />
                          おすすめの方法:
                        </Text>
                        <br />
                        <Text variant="sm" weight="medium">
                          ファイルパス名をつけることで、ファイルを管理しやすくなります。
                        </Text>
                        <Text variant="sm" weight="medium" leading="relaxed">
                          例:
                          <br /> ・ファイルのパス:
                          /MyelinBaseソリューション部/社内資料/20251214就業規則.pdf
                          <br />
                          ・タグ: MyelinBaseソリューション部, 社内資料, 就業規則
                        </Text>
                      </div>
                    </Tooltip>
                  </Text>
                  <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                    <div className="relative flex-1">
                      <Input
                        id="uploadFormTagsInput"
                        size="md"
                        value={tagsInput}
                        onFocus={() => setShowTagSuggestions(true)}
                        onClick={() => setShowTagSuggestions(true)}
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
                    <div className="shrink-0 ml-auto">
                      <Button
                        size="sm"
                        type="submit"
                        className={cn(
                          (isPending || isOverLimit) &&
                            "bg-primary/70 cursor-not-allowed hover:bg-primary/70"
                        )}
                        disabled={
                          isPending || selectedFiles.length === 0 || isOverLimit
                        }
                      >
                        {isPending ? (
                          <Spinner size="3.5" color="background" />
                        ) : (
                          <Upload className="size-3.5" />
                        )}
                        <Text
                          variant="sm"
                          color="white"
                          weight="semibold"
                          as="span"
                        >
                          アップロード開始
                        </Text>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {isOverLimit && (
                <Alert color="warning">
                  <AlertTriangle className="size-4 shrink-0" />
                  <Text variant="sm" color="warning" weight="medium">
                    タグの上限（{MAX_DISPLAY_TAGS}個）を超えています。
                    更新するにはタグを減らしてください。
                  </Text>
                </Alert>
              )}

              {currentTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3">
                  {visibleTags.map((tag) => (
                    <TagChip
                      isDeleted={true}
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
            </div>

            <FilePreviewList
              previews={previews}
              onRemove={handleRemoveFile}
              onPreviewClick={setPreviewingFile}
              selectedFilesCount={selectedFiles.length}
            />
          </div>
        )}
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
            <iframe
              src={previewingFile.url}
              className="w-full h-[70vh] rounded border shadow-sm bg-background"
              title="PDF Preview"
            />
          )}
        </Modal>
      )}
    </div>
  );
}
