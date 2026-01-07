import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { CONCURRENT_UPLOADS } from "@/features/documents/config/document-constants";
import { usePostDocumentsUpload } from "@/lib/api/generated/default/default";
import {
  DocumentResponse,
  DocumentStatus,
  GetDocumentsResponse,
  UploadRequestFileResult,
  UploadRequestRequest,
} from "@/lib/api/generated/model";
import { queryKeys } from "@/lib/queryKeys";
import { computeFileHash } from "@/lib/utils";

type UploadStatus =
  | "idle"
  | "requesting"
  | "uploading"
  | "completing"
  | "success"
  | "error";

export interface UploadProgress {
  fileName: string;
  progress: number; // 0 or 100 (簡易版なので途中経過はなし)
  status: "pending" | "uploading" | "completed" | "error";
  errorCode?: string; // エラーコード（重複検知時など）
}

interface UploadPayload {
  files: File[];
  tags: string[];
  fileHashes?: Map<string, string>; // 事前計算済みハッシュ（オプション）
}

// アップロード結果サマリー
export interface UploadResultSummary {
  successCount: number;
  backendDuplicateCount: number;
  otherErrorCount: number;
  totalRequested: number;
}

// バックエンド重複エラーコード
const BACKEND_DUPLICATE_ERROR_CODE = "DOCUMENTS_DUPLICATE_CONTENT";

/**
 * 並列数を制限してPromiseを実行するユーティリティ
 * p-limit等の外部ライブラリを使わずに実装
 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let currentIndex = 0;

  async function runNext(): Promise<void> {
    while (currentIndex < tasks.length) {
      const index = currentIndex++;
      results[index] = await tasks[index]();
    }
  }

  // concurrency数分のワーカーを起動
  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => runNext()
  );

  await Promise.all(workers);
  return results;
}

export function useUpload() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, UploadProgress>
  >({});
  const [lastResultSummary, setLastResultSummary] =
    useState<UploadResultSummary | null>(null);

  const uploadRequestMutation = usePostDocumentsUpload();

  const clearProgress = () => {
    setStatus("idle");
    setUploadProgress({});
    setLastResultSummary(null);
  };

  const upload = async (
    payload: UploadPayload
  ): Promise<UploadResultSummary> => {
    // 結果サマリーを初期化
    const resultSummary: UploadResultSummary = {
      successCount: 0,
      backendDuplicateCount: 0,
      otherErrorCount: 0,
      totalRequested: payload.files.length,
    };

    try {
      setStatus("requesting");
      setLastResultSummary(null);

      // 初期進捗セット
      const initialProgress: Record<string, UploadProgress> = {};
      payload.files.forEach((f) => {
        initialProgress[f.name] = {
          fileName: f.name,
          progress: 0,
          status: "pending",
        };
      });
      setUploadProgress(initialProgress);

      // ハッシュマップを構築（事前計算済みがあれば使用、なければ計算）
      let hashMap: Map<string, string | null>;

      if (payload.fileHashes && payload.fileHashes.size > 0) {
        // 事前計算済みハッシュを使用
        hashMap = new Map();
        payload.fileHashes.forEach((hash, name) => {
          hashMap.set(name, hash);
        });
      } else {
        // ハッシュを新規計算
        const fileHashes = await Promise.all(
          payload.files.map(async (f) => {
            try {
              const hash = await computeFileHash(f);
              return { name: f.name, hash };
            } catch {
              return { name: f.name, hash: null };
            }
          })
        );

        hashMap = new Map();
        fileHashes.forEach(({ name, hash }) => {
          hashMap.set(name, hash);
        });
      }

      const requestBody: UploadRequestRequest = {
        files: payload.files.map((f) => ({
          fileName: f.name,
          contentType: f.type,
          fileSize: f.size,
          fileHash: hashMap.get(f.name) || undefined,
        })),
        tags: payload.tags,
      };

      // 1. 署名付きURL取得
      const response = await uploadRequestMutation.mutateAsync({
        data: requestBody,
      });

      if (!response.results || response.results.length === 0) {
        throw new Error("No upload URLs returned");
      }

      setStatus("uploading");

      // 2. S3へアップロード（並列数制限付き）
      const uploadTasks = response.results.map(
        (result: UploadRequestFileResult) => async () => {
          if (result.status !== "success" || !result.data) {
            // エラーの種類を判別
            if (result.errorCode === BACKEND_DUPLICATE_ERROR_CODE) {
              resultSummary.backendDuplicateCount++;
            } else {
              resultSummary.otherErrorCount++;
            }

            setUploadProgress((prev) => ({
              ...prev,
              [result.fileName]: {
                ...prev[result.fileName],
                status: "error",
                errorCode: result.errorCode,
              },
            }));
            return null;
          }

          const uploadData = result.data;
          const file = payload.files.find(
            (file) => file.name === result.fileName
          );
          if (!file) throw new Error(`File not found for ${result.fileName}`);

          let targetUrl = uploadData.uploadUrl;
          if (targetUrl.includes("localstack")) {
            targetUrl = targetUrl.replace("localstack", "localhost");
          }

          try {
            // ステータスを「アップロード中」に変更
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: {
                ...prev[file.name],
                status: "uploading",
                progress: 0,
              },
            }));

            // fetchでアップロード
            const s3Response = await fetch(targetUrl, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type,
              },
            });

            if (!s3Response.ok) {
              const errorText = await s3Response.text();
              throw new Error(
                `S3 upload failed: ${s3Response.status} ${s3Response.statusText} - ${errorText}`
              );
            }

            // ステータスを「完了」に変更
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: {
                ...prev[file.name],
                status: "completed",
                progress: 100,
              },
            }));

            resultSummary.successCount++;

            return {
              documentId: uploadData.documentId,
              fileName: file.name,
              fileSize: file.size,
              contentType: file.type,
              s3Key: uploadData.s3Key,
            };
          } catch (error) {
            resultSummary.otherErrorCount++;
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: {
                ...prev[file.name],
                status: "error",
              },
            }));
            return null;
          }
        }
      );

      // 並列数を制限してアップロード実行
      const uploadedFilesResults = await runWithConcurrency(
        uploadTasks,
        CONCURRENT_UPLOADS
      );
      const successfulUploads = uploadedFilesResults.filter(
        (item): item is NonNullable<typeof item> => item !== null
      );

      // 結果サマリーを保存
      setLastResultSummary(resultSummary);

      if (
        successfulUploads.length === 0 &&
        resultSummary.backendDuplicateCount === 0
      ) {
        setStatus("error");
        throw new Error("すべてのファイルのアップロードに失敗しました。");
      }

      setStatus("success");

      if (successfulUploads.length > 0) {
        qc.setQueriesData<GetDocumentsResponse>(
          { queryKey: queryKeys.documents },
          (oldData) => {
            if (!oldData) return oldData;

            const newDocuments: DocumentResponse[] = successfulUploads.map(
              (upload) => ({
                documentId: upload.documentId,
                fileName: upload.fileName,
                fileSize: upload.fileSize,
                contentType: upload.contentType,
                status: DocumentStatus.PENDING_UPLOAD,
                processingStatus: "ACTIVE",
                tags: payload.tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
            );

            return {
              ...oldData,
              documents: [...newDocuments, ...(oldData.documents || [])],
            };
          }
        );

        qc.invalidateQueries({ queryKey: queryKeys.documents });
      }

      return resultSummary;
    } catch (error) {
      setStatus("error");
      setLastResultSummary(resultSummary);
      throw error;
    }
  };

  return {
    upload: (payload: UploadPayload) => {
      upload(payload).catch(() => {});
    },
    uploadAsync: upload,
    clearProgress,
    isPending: status === "requesting" || status === "uploading",
    status,
    progress: uploadProgress,
    error: uploadRequestMutation.error,
    lastResultSummary,
  };
}
