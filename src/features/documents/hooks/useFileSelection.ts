import { useCallback, useEffect, useState } from "react";

import { Preview } from "@/features/documents/components/FilePreviewList";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILES,
} from "@/features/documents/config/document-constants";
import { computeFileHash } from "@/lib/utils";

interface ProcessingProgress {
  current: number;
  total: number;
}

// 重複情報を含むファイル情報
export interface FileWithDuplicateInfo {
  file: File;
  hash: string | null;
  isDuplicate: boolean;
  duplicateOf: string | null; // 重複元のファイル名
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

  // 重複検出用のstate
  const [fileHashes, setFileHashes] = useState<Map<string, string>>(new Map());
  const [duplicateFiles, setDuplicateFiles] = useState<
    Map<string, string | null>
  >(new Map()); // fileName -> duplicateOf

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
  async function buildPreviewForFile(
    file: File,
    duplicateOf: string | null
  ): Promise<Preview | null> {
    const mime = file.type || "application/octet-stream";
    const isAllowed = ALLOWED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    const isDuplicate = duplicateOf !== null;

    if (
      mime.startsWith("text/") ||
      (isAllowed &&
        (file.name.toLowerCase().endsWith(".md") ||
          file.name.toLowerCase().endsWith(".markdown")))
    ) {
      try {
        const text = await file.text();
        return {
          kind: "text" as const,
          name: file.name,
          size: file.size,
          mime,
          snippet: text.slice(0, 2000),
          isDuplicate,
          duplicateOf,
        };
      } catch {
        return {
          kind: "text" as const,
          name: file.name,
          size: file.size,
          mime,
          snippet: "",
          isDuplicate,
          duplicateOf,
        };
      }
    } else if (mime === "application/pdf") {
      const url = URL.createObjectURL(file);
      return {
        kind: "pdf" as const,
        name: file.name,
        size: file.size,
        mime,
        url,
        isDuplicate,
        duplicateOf,
      };
    }

    return null;
  }

  // 複数ファイルのプレビュー生成（最初のMAX_FILES件のみ詳細）
  async function buildPreviews(
    files: File[],
    duplicatesMap: Map<string, string | null>
  ) {
    const out: Preview[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (i < MAX_FILES) {
        const duplicateOf = duplicatesMap.get(file.name) ?? null;
        const preview = await buildPreviewForFile(file, duplicateOf);
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

  // 重複検出を行う
  async function detectDuplicates(
    files: File[],
    existingHashes: Map<string, string>
  ): Promise<{
    newHashes: Map<string, string>;
    duplicates: Map<string, string | null>;
  }> {
    const newHashes = new Map(existingHashes);
    const duplicates = new Map<string, string | null>();

    // ハッシュ → 最初に登場したファイル名
    const hashToFirstFileName = new Map<string, string>();

    // 既存のハッシュからマップを構築
    existingHashes.forEach((hash, fileName) => {
      if (!hashToFirstFileName.has(hash)) {
        hashToFirstFileName.set(hash, fileName);
      }
    });

    // 新しいファイルのハッシュを計算
    for (const file of files) {
      const hash = await computeFileHash(file);
      newHashes.set(file.name, hash);

      // 同じハッシュを持つファイルが既にあるかチェック
      const existingFileName = hashToFirstFileName.get(hash);
      if (existingFileName && existingFileName !== file.name) {
        // 重複を検出
        duplicates.set(file.name, existingFileName);
      } else {
        // 最初のファイルとして登録
        hashToFirstFileName.set(hash, file.name);
      }
    }

    return { newHashes, duplicates };
  }

  const addFiles = useCallback(
    async (
      files: File[],
      existingRemoteFileNames?: Set<string>,
      options?: { clearExisting?: boolean }
    ) => {
      if (!files.length) return;

      // clearExistingがtrueの場合、既存ファイルをクリアしてから追加
      const shouldClear = options?.clearExisting ?? false;
      const currentFiles = shouldClear ? [] : selectedFiles;
      const currentDuplicates = shouldClear
        ? new Map<string, string | null>()
        : duplicateFiles;

      if (shouldClear) {
        // 既存のプレビューURLを解放
        setPreviews((prev) => {
          prev.forEach((p) => {
            if (p.kind === "pdf" && p.url) {
              URL.revokeObjectURL(p.url);
            }
          });
          return [];
        });
        setFileHashes(new Map());
        setDuplicateFiles(new Map());
        setErrorMessage(null);
      }

      setIsProcessing(true);
      setProgress({ current: 0, total: files.length });
      if (!shouldClear) setErrorMessage(null);

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

        // アクティブなファイル数（フロントエンド重複を除く）
        const activeFilesCount = currentFiles.length - currentDuplicates.size;
        const remainingSlots = MAX_FILES - activeFilesCount;
        const filesToAdd = validCandidates.slice(
          0,
          Math.max(0, remainingSlots)
        );
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
        const existingNames = new Set(currentFiles.map((f) => f.name));
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

        const next = [...currentFiles, ...newFiles];
        setSelectedFiles(next);

        // 4. ハッシュ計算と重複検出
        setProgress({ current: 0, total: next.length });
        const { newHashes, duplicates } = await detectDuplicates(
          next,
          new Map() // 全ファイルを再計算（追加ファイルのみでなく全体で検出）
        );

        setFileHashes(newHashes);
        setDuplicateFiles(duplicates);

        // プレビュー生成（重複情報を含める）
        await buildPreviews(next, duplicates);
      } finally {
        setIsProcessing(false);
        setProgress({ current: 0, total: 0 });
      }
    },
    [selectedFiles, fileHashes, duplicateFiles]
  );

  const removeFile = useCallback(
    async (name: string, options?: { skipDuplicateRecalc?: boolean }) => {
      const next = selectedFiles.filter((f) => f.name !== name);
      setSelectedFiles(next);

      // ハッシュを更新
      const newHashes = new Map(fileHashes);
      newHashes.delete(name);
      setFileHashes(newHashes);

      // 重複情報を更新
      const newDuplicates = new Map(duplicateFiles);
      newDuplicates.delete(name);

      // 重複再計算をスキップするかどうか（アップロード完了後など）
      if (options?.skipDuplicateRecalc) {
        // 単純にそのファイルの重複情報を削除するだけ
        setDuplicateFiles(newDuplicates);
        await buildPreviews(next, newDuplicates);
      } else {
        // 通常のフロー：重複情報を再計算
        const { duplicates } = await detectDuplicates(next, new Map());
        setDuplicateFiles(duplicates);
        await buildPreviews(next, duplicates);
      }
    },
    [selectedFiles, fileHashes, duplicateFiles]
  );

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    setErrorMessage(null);
    setFileHashes(new Map());
    setDuplicateFiles(new Map());
  }, []);

  // アップロード対象のファイル（重複を除外）
  const uploadableFiles = selectedFiles.filter(
    (f) => !duplicateFiles.has(f.name)
  );

  // 重複ファイル数
  const duplicateCount = duplicateFiles.size;

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
    // 重複関連
    fileHashes,
    duplicateFiles,
    duplicateCount,
    uploadableFiles,
  };
}
