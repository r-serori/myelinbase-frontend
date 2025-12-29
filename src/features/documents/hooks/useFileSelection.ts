import { useCallback, useEffect, useState } from "react";

import { Preview } from "@/features/documents/components/FilePreviewList";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILES,
} from "@/features/documents/config/document-constants";

interface ProcessingProgress {
  current: number;
  total: number;
}

export function useFileSelection() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    current: 0,
    total: 0,
  });

  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.kind === "pdf" && p.url) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [previews]);

  // 単一ファイルのプレビュー生成
  async function buildPreviewForFile(file: File): Promise<Preview | null> {
    const mime = file.type || "application/octet-stream";
    const isAllowed = ALLOWED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (
      mime.startsWith("text/") ||
      (isAllowed &&
        (file.name.toLowerCase().endsWith(".md") ||
          file.name.toLowerCase().endsWith(".markdown")))
    ) {
      try {
        const text = await file.text();
        return {
          kind: "text",
          name: file.name,
          size: file.size,
          mime,
          snippet: text.slice(0, 2000),
        };
      } catch {
        return {
          kind: "text",
          name: file.name,
          size: file.size,
          mime,
          snippet: "",
        };
      }
    } else if (mime === "application/pdf") {
      const url = URL.createObjectURL(file);
      return { kind: "pdf", name: file.name, size: file.size, mime, url };
    }

    return null;
  }

  // 複数ファイルのプレビュー生成（最初のMAX_PREVIEW_COUNT件のみ詳細）
  async function buildPreviews(files: File[]) {
    const MAX_PREVIEW_COUNT = 20;
    const out: Preview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (i < MAX_PREVIEW_COUNT) {
        const preview = await buildPreviewForFile(file);
        if (preview) {
          out.push(preview);
        }
      }
      // MAX_PREVIEW_COUNT以降は簡易表示（プレビュー生成しない）
    }

    setPreviews(out);
  }

  function getUniqueFileName(file: File, existingNames: Set<string>): File {
    const name = file.name;
    if (!existingNames.has(name)) return file;

    const dotIndex = name.lastIndexOf(".");
    const ext = dotIndex !== -1 ? name.substring(dotIndex) : "";
    const base = dotIndex !== -1 ? name.substring(0, dotIndex) : name;

    let counter = 1;
    let newName = `${base} (${counter})${ext}`;

    while (existingNames.has(newName)) {
      counter++;
      newName = `${base} (${counter})${ext}`;
    }

    return new File([file], newName, {
      type: file.type,
      lastModified: file.lastModified,
    });
  }

  function isAllowedFile(file: File): boolean {
    const name = file.name.toLowerCase();
    if (name.startsWith(".")) return false;
    if (file.size === 0) return false;
    return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  }

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;

      setIsProcessing(true);
      setProgress({ current: 0, total: files.length });
      setErrorMessage(null);

      // UIをブロックしないために次のフレームで処理開始
      await new Promise((resolve) => setTimeout(resolve, 0));

      try {
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        // ファイル数上限チェック
        const remainingSlots = MAX_FILES - selectedFiles.length;
        if (remainingSlots <= 0) {
          setErrorMessage(`ファイル数が上限（${MAX_FILES}件）に達しています。`);
          return;
        }

        const filesToProcess = files.slice(0, remainingSlots);
        const skippedByLimit = files.length - filesToProcess.length;

        for (let i = 0; i < filesToProcess.length; i++) {
          const f = filesToProcess[i];

          if (isAllowedFile(f)) {
            validFiles.push(f);
          } else {
            if (f.name !== "." && !f.name.startsWith(".")) {
              invalidFiles.push(f.name);
            }
          }

          // 進捗更新（100件ごとにUIを更新）
          if (i % 100 === 0) {
            setProgress({ current: i + 1, total: filesToProcess.length });
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        // エラーメッセージ構築
        const errorMessages: string[] = [];

        if (skippedByLimit > 0) {
          errorMessages.push(
            `ファイル数上限（${MAX_FILES}件）のため、${skippedByLimit}件がスキップされました`
          );
        }

        if (invalidFiles.length > 0) {
          const displayInvalid = invalidFiles.slice(0, 5);
          const remaining = invalidFiles.length - 5;
          errorMessages.push(
            `未対応形式のためスキップ: ${displayInvalid.join(", ")}${
              remaining > 0 ? ` 他 ${remaining} 件` : ""
            }`
          );
        }

        if (errorMessages.length > 0) {
          setErrorMessage(errorMessages.join("\n"));
        }

        if (validFiles.length === 0) return;

        const existingNames = new Set(selectedFiles.map((f) => f.name));

        const newFiles = validFiles.map((f) => {
          const uniqueFile = getUniqueFileName(f, existingNames);
          existingNames.add(uniqueFile.name);
          return uniqueFile;
        });

        const next = [...selectedFiles, ...newFiles];
        setSelectedFiles(next);

        // プレビュー生成
        setProgress({ current: 0, total: next.length });
        await buildPreviews(next);
      } finally {
        setIsProcessing(false);
        setProgress({ current: 0, total: 0 });
      }
    },
    [selectedFiles]
  );

  const removeFile = useCallback(
    async (name: string) => {
      const next = selectedFiles.filter((f) => f.name !== name);
      setSelectedFiles(next);
      await buildPreviews(next);
    },
    [selectedFiles]
  );

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    setErrorMessage(null);
  }, []);

  return {
    selectedFiles,
    previews,
    errorMessage,
    setErrorMessage,
    isProcessing,
    progress,
    addFiles,
    removeFile,
    clearFiles,
  };
}
