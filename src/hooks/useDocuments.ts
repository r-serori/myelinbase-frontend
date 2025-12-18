import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type {
  GetDocumentsResponse,
  DocumentResponse,
  GetDocumentResponse,
  UpdateTagsRequest,
  UpdateTagsResponse,
  BatchDeleteRequest,
  BatchDeleteResponse,
} from "@/lib/schemas/document";

export function useDocuments(filters?: {
  filename?: string;
  tags?: string[];
  mode?: "AND" | "OR";
}) {
  const params = new URLSearchParams();
  if (filters?.filename) params.set("filename", filters.filename);
  if (filters?.tags && filters.tags.length > 0) {
    params.set("tag", filters.tags.join(","));
  }
  if (filters?.mode) {
    params.set("mode", filters.mode.toLowerCase());
  }
  const query = params.toString();

  return useQuery<GetDocumentsResponse>({
    queryKey: [
      ...queryKeys.documents,
      {
        filename: filters?.filename || "",
        tags: filters?.tags || [],
        mode: filters?.mode || "AND",
      },
    ],
    queryFn: () =>
      apiFetch<GetDocumentsResponse>(`/documents${query ? `?${query}` : ""}`),
    staleTime: 10_000,
  });
}

export function useDocumentStatus(documentId?: string) {
  const queryClient = useQueryClient();

  return useQuery<GetDocumentResponse>({
    queryKey: queryKeys.documentStatus(documentId || ""),
    queryFn: async () => {
      // バックエンドは { document: DocumentResponse } を返す
      const res = await apiFetch<GetDocumentResponse>(
        `/documents/${documentId}`
      );
      return res;
    },
    enabled: !!documentId,
    placeholderData: () => {
      if (!documentId) return undefined;

      const queries = queryClient
        .getQueryCache()
        .findAll({ queryKey: queryKeys.documents });

      for (const query of queries) {
        const data = query.state.data as GetDocumentsResponse | undefined;
        const found = data?.documents?.find((d) => d.documentId === documentId);
        if (found) {
          return { document: found };
        }
      }
      return undefined;
    },
  });
}

// Helper to get just the document object easily
export function useDocument(documentId?: string) {
  return useQuery<GetDocumentResponse, Error, DocumentResponse>({
    queryKey: queryKeys.documentStatus(documentId || ""),
    queryFn: () => apiFetch<GetDocumentResponse>(`/documents/${documentId}`),
    enabled: !!documentId,
    select: (data) => data.document,
    refetchInterval: (query) => {
      const status = query.state.data?.document.status;
      if (status === "COMPLETED" || status === "FAILED") {
        return false;
      }
      return 3000;
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      return apiFetch(`/documents/${documentId}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.documents });
    },
  });
}

export function useBatchDeleteDocuments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (documentIds: string[]) => {
      const body: BatchDeleteRequest = { documentIds };
      return apiFetch<BatchDeleteResponse>("/documents/batch-delete", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.documents });
    },
  });
}

export function useUpdateDocumentTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { documentId: string; tags: string[] }) => {
      const body: UpdateTagsRequest = { tags: payload.tags };
      return apiFetch<UpdateTagsResponse>(
        `/documents/${payload.documentId}/tags`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );
    },
    onSuccess: async (_, variables) => {
      await qc.invalidateQueries({ queryKey: queryKeys.documents });
      await qc.invalidateQueries({
        queryKey: queryKeys.documentStatus(variables.documentId),
      });
    },
    retry: 0,
  });
}

export function useGetDocumentDownloadUrl() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      return apiFetch<{ downloadUrl: string }>(
        `/documents/${documentId}/download-url`
      );
    },
  });
}
