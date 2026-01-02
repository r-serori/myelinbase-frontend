import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { usePostDocumentsUpload } from "@/lib/api/generated/default/default";
import {
  DocumentResponse,
  DocumentStatus,
  GetDocumentsResponse,
  UploadRequestFileResult,
  UploadRequestRequest,
} from "@/lib/api/generated/model";
import { queryKeys } from "@/lib/queryKeys";

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
}

export function useUpload() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, UploadProgress>
  >({});

  const uploadRequestMutation = usePostDocumentsUpload();

  const upload = async (payload: { files: File[]; tags: string[] }) => {
    try {
      setStatus("requesting");

      const requestBody: UploadRequestRequest = {
        files: payload.files.map((f) => ({
          fileName: f.name,
          contentType: f.type,
          fileSize: f.size,
        })),
        tags: payload.tags,
      };

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

      // 1. 署名付きURL取得
      const response = await uploadRequestMutation.mutateAsync({
        data: requestBody,
      });

      if (!response.results || response.results.length === 0) {
        throw new Error("No upload URLs returned");
      }

      setStatus("uploading");

      // 2. S3へアップロード（並列実行）
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

            return {
              documentId: uploadData.documentId,
              fileName: file.name,
              fileSize: file.size,
              contentType: file.type,
              s3Key: uploadData.s3Key,
            };
          } catch (error) {
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

      const uploadedFilesResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadedFilesResults.filter(
        (item): item is NonNullable<typeof item> => item !== null
      );

      if (successfulUploads.length === 0) {
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

      setTimeout(() => {
        setStatus("idle");
        setUploadProgress({});
      }, 3000);

      return successfulUploads;
    } catch (error) {
      setStatus("error");
      throw error;
    }
  };

  return {
    upload: (payload: { files: File[]; tags: string[] }) => {
      upload(payload).catch(() => {});
    },
    uploadAsync: upload,
    isPending: status === "requesting" || status === "uploading",
    status,
    progress: uploadProgress,
    error: uploadRequestMutation.error,
  };
}
