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
    // 隠しファイル除外
    if (name.startsWith(".")) return false;
    // 空ファイル除外
    if (file.size === 0) return false;
    // 許可された拡張子かチェック
    return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  }

  const addFiles = useCallback(
    async (files: File[], existingRemoteFileNames?: Set<string>) => {
      if (!files.length) return;

      setIsProcessing(true);
      setProgress({ current: 0, total: files.length });
      setErrorMessage(null);

      await new Promise((resolve) => setTimeout(resolve, 0));

      try {
        const validCandidates: File[] = [];
        const invalidFileNames: string[] = [];

        for (const f of files) {
          if (isAllowedFile(f)) {
            validCandidates.push(f);
          } else {
            if (f.name === "." || f.name.startsWith(".")) {
              invalidFileNames.push(f.name);
            } else {
              invalidFileNames.push(f.name);
            }
          }
        }

        const remainingSlots = MAX_FILES - selectedFiles.length;
        const filesToAdd = validCandidates.slice(0, remainingSlots);
        const skippedByLimitCount = validCandidates.length - filesToAdd.length;
        const errorMessages: string[] = [];

        if (skippedByLimitCount > 0) {
          errorMessages.push(
            `ファイル数上限（${MAX_FILES}件）のため、${skippedByLimitCount}件がスキップされました`
          );
        }

        if (invalidFileNames.length > 0) {
          // 無効ファイルのエラー表示（表示数が多すぎないように制限）
          const displayInvalid = invalidFileNames.slice(0, 5);
          const remaining = invalidFileNames.length - 5;

          // .DS_Store だけの場合はユーザー体験的にエラーを出さない方が親切かもしれないが、
          // 明示的に出すなら以下のようにする
          const isOnlySystemFiles = invalidFileNames.every((name) =>
            name.startsWith(".")
          );

          if (!isOnlySystemFiles) {
            // システムファイルのみの場合は通知を抑制する（必要に応じて変更可）
            errorMessages.push(
              `未対応形式のためスキップ: ${displayInvalid.join(", ")}${
                remaining > 0 ? ` 他 ${remaining} 件` : ""
              }`
            );
          }
        }

        if (errorMessages.length > 0) {
          setErrorMessage(errorMessages.join("\n"));
        }

        if (filesToAdd.length === 0) return;

        // 3. 追加対象ファイルの処理（重複名リネームなど）
        const existingNames = new Set(selectedFiles.map((f) => f.name));
        if (existingRemoteFileNames) {
          existingRemoteFileNames.forEach((name) => existingNames.add(name));
        }

        const newFiles: File[] = [];

        // プログレスバーの更新用
        setProgress({ current: 0, total: filesToAdd.length });

        for (let i = 0; i < filesToAdd.length; i++) {
          const f = filesToAdd[i];
          const uniqueFile = getUniqueFileName(f, existingNames);
          existingNames.add(uniqueFile.name);
          newFiles.push(uniqueFile);

          // 処理が重い場合に備えてUI更新の隙間を作る
          if (i % 5 === 0) {
            setProgress({ current: i + 1, total: filesToAdd.length });
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        const next = [...selectedFiles, ...newFiles];
        setSelectedFiles(next);

        // プレビュー生成
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
