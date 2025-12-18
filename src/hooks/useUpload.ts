import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type {
  UploadRequestRequest,
  UploadRequestResponse,
  UploadRequestFileResult,
} from "@/lib/schemas/document";

type UploadStatus =
  | "idle"
  | "requesting"
  | "uploading"
  | "completing"
  | "success"
  | "error";

export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: "pending" | "uploading" | "completed" | "error";
}

export function useUpload() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, UploadProgress>
  >({});

  const uploadMutation = useMutation({
    mutationFn: async (payload: { files: File[]; tags: string[] }) => {
      try {
        setStatus("requesting");

        // 1. Request upload URLs
        const requestBody: UploadRequestRequest = {
          files: payload.files.map((f) => ({
            fileName: f.name,
            contentType: f.type,
            fileSize: f.size,
          })),
          tags: payload.tags,
        };

        // Initialize progress
        const initialProgress: Record<string, UploadProgress> = {};
        payload.files.forEach((f) => {
          initialProgress[f.name] = {
            fileName: f.name,
            progress: 0,
            status: "pending",
          };
        });
        setUploadProgress(initialProgress);

        const response = await apiFetch<UploadRequestResponse>(
          "/documents/upload-request",
          {
            method: "POST",
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.results || response.results.length === 0) {
          throw new Error("No upload URLs returned");
        }

        setStatus("uploading");

        // 2. Upload files to S3
        const uploadPromises = response.results.map(
          async (result: UploadRequestFileResult) => {
            if (result.status !== "success" || !result.data) {
              setUploadProgress((prev) => ({
                ...prev,
                [result.fileName]: {
                  ...prev[result.fileName],
                  status: "error",
                },
              }));
              return null;
            }

            const uploadData = result.data;
            const file = payload.files.find(
              (file) => file.name === result.fileName
            );
            if (!file) throw new Error(`File not found for ${result.fileName}`);

            try {
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: { ...prev[file.name], status: "uploading" },
              }));

              // S3への直接アップロード
              // SignedUrl を使用して PUT リクエストを送信
              // Authorization ヘッダーは除外（署名に含まれるため）
              const s3Response = await fetch(uploadData.uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                  "Content-Type": file.type,
                },
              });

              if (!s3Response.ok) {
                // エラーレスポンスの詳細を取得
                const errorText = await s3Response.text();
                throw new Error(
                  `S3 upload failed: ${s3Response.status} ${s3Response.statusText} - ${errorText}`
                );
              }

              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: {
                  ...prev[file.name],
                  progress: 100,
                  status: "completed",
                },
              }));

              return { documentId: uploadData.documentId, fileName: file.name };
            } catch (error) {
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: { ...prev[file.name], status: "error" },
              }));
              return null;
            }
          }
        );

        const uploadedFiles = await Promise.all(uploadPromises);
        const successfulUploads = uploadedFiles.filter(
          (
            item: { documentId: string; fileName: string } | null
          ): item is { documentId: string; fileName: string } => item !== null
        );

        // バックエンド側はS3イベントトリガー等で処理を開始するため、
        // フロントエンドからはアップロード完了をもって処理完了とする
        setStatus("success");
        return successfulUploads;
      } catch (error) {
        setStatus("error");
        throw error;
      }
    },
    onSuccess: () => {
      // 一覧を更新
      qc.invalidateQueries({ queryKey: queryKeys.documents });
      // プログレス表示を少し残してからリセット
      setTimeout(() => {
        setStatus("idle");
        setUploadProgress({});
      }, 3000);
    },
  });

  return {
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isPending: uploadMutation.isPending,
    status,
    progress: uploadProgress,
    error: uploadMutation.error,
  };
}
