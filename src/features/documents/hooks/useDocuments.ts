import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getDocumentsIdDownloadUrl,
  getGetDocumentsIdQueryKey,
  useDeleteDocumentsId,
  useGetDocuments,
  useGetDocumentsId,
  usePatchDocumentsIdTags,
  usePostDocumentsBatchDelete,
} from "@/lib/api/generated/default/default";
import {
  BatchDeleteResponse,
  DeleteDocumentResponse,
  GetDocumentResponse,
  GetDocumentsResponse,
  UpdateTagsResponse,
} from "@/lib/api/generated/model";
import { queryKeys } from "@/lib/queryKeys";

export function useDocuments(filters?: {
  filename?: string;
  tags?: string[];
  mode?: "AND" | "OR";
}) {
  return useGetDocuments({
    query: {
      queryKey: [
        ...queryKeys.documents,
        {
          filename: filters?.filename || "",
          tags: filters?.tags || [],
          mode: filters?.mode || "AND",
        },
      ],
      staleTime: 10_000,
    },
  });
}

export function useDocumentById(documentId?: string) {
  const queryClient = useQueryClient();

  const query = useGetDocumentsId(documentId!, {
    query: {
      enabled: !!documentId,
      staleTime: 10_000,
      placeholderData: () => {
        if (!documentId) return undefined;
        const queries = queryClient.getQueryCache().findAll({
          queryKey: queryKeys.documents,
        });

        for (const query of queries) {
          const data = query.state.data as GetDocumentsResponse | undefined;
          const found = data?.documents?.find(
            (d) => d.documentId === documentId
          );
          if (found) {
            return { document: found };
          }
        }
        return undefined;
      },
    },
  });

  // 取得成功時に一覧キャッシュを同期
  useEffect(() => {
    if (query.data?.document && documentId) {
      queryClient.setQueriesData<GetDocumentsResponse>(
        { queryKey: queryKeys.documents },
        (oldData) => {
          if (!oldData?.documents) return oldData;

          // 既存ドキュメントを更新
          const exists = oldData.documents.some(
            (doc) => doc.documentId === documentId
          );

          if (!exists) return oldData;

          return {
            ...oldData,
            documents: oldData.documents.map((doc) =>
              doc.documentId === documentId ? query.data!.document : doc
            ),
          };
        }
      );
    }
  }, [query.data?.document, documentId, queryClient]);

  return query;
}

/**
 * ドキュメント削除
 */
export function useDeleteDocument() {
  const qc = useQueryClient();
  const mutation = useDeleteDocumentsId({
    mutation: {
      onSuccess: (_data: DeleteDocumentResponse, variables: { id: string }) => {
        // 1. 詳細画面のキャッシュを削除
        qc.removeQueries({ queryKey: getGetDocumentsIdQueryKey(variables.id) });

        // 2. 一覧画面のキャッシュから除外
        qc.setQueriesData<GetDocumentsResponse>(
          { queryKey: queryKeys.documents },
          (oldData) => {
            if (!oldData?.documents) return oldData;
            return {
              ...oldData,
              documents: oldData.documents.filter(
                (doc) => doc.documentId !== variables.id
              ),
            };
          }
        );
      },
    },
  });

  return {
    ...mutation,
    mutateAsync: async (documentId: string) =>
      mutation.mutateAsync({ id: documentId }),
  };
}

/**
 * ドキュメント一括削除
 */
export function useBatchDeleteDocuments() {
  const qc = useQueryClient();
  const mutation = usePostDocumentsBatchDelete({
    mutation: {
      onSuccess: (data: BatchDeleteResponse) => {
        const succeededIds = data.results
          .filter((r) => r.status === "success")
          .map((r) => r.documentId);

        if (succeededIds.length === 0) return;

        succeededIds.forEach((id) => {
          qc.removeQueries({ queryKey: getGetDocumentsIdQueryKey(id) });
        });

        qc.setQueriesData<GetDocumentsResponse>(
          { queryKey: queryKeys.documents },
          (oldData) => {
            if (!oldData?.documents) return oldData;
            return {
              ...oldData,
              documents: oldData.documents.filter(
                (doc) => !succeededIds.includes(doc.documentId)
              ),
            };
          }
        );
      },
    },
  });

  return {
    ...mutation,
    mutateAsync: async (documentIds: string[]) =>
      mutation.mutateAsync({ data: { documentIds } }),
  };
}

/**
 * ドキュメントタグ更新
 */
export function useUpdateDocumentTags() {
  const qc = useQueryClient();
  const mutation = usePatchDocumentsIdTags({
    mutation: {
      onSuccess: (
        data: UpdateTagsResponse,
        variables: { id: string; data: { tags: string[] } }
      ) => {
        // 1. 詳細画面のキャッシュを更新
        qc.setQueryData<GetDocumentResponse>(
          getGetDocumentsIdQueryKey(variables.id),
          () => {
            return { document: data.document };
          }
        );

        // 2. 一覧画面のキャッシュを更新
        qc.setQueriesData<GetDocumentsResponse>(
          { queryKey: queryKeys.documents },
          (oldData) => {
            if (!oldData?.documents) return oldData;
            return {
              ...oldData,
              documents: oldData.documents.map((doc) =>
                doc.documentId === variables.id ? data.document : doc
              ),
            };
          }
        );
      },
    },
  });

  return {
    ...mutation,
    mutateAsync: async (payload: { documentId: string; tags: string[] }) => {
      return mutation.mutateAsync({
        id: payload.documentId,
        data: { tags: payload.tags },
      });
    },
  };
}

export function useGetDocumentDownloadUrl() {
  return useMutation({
    mutationFn: async (documentId: string) =>
      getDocumentsIdDownloadUrl(documentId),
  });
}
