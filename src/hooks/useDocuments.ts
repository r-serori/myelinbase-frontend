import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';
import type { DocumentItem } from '@/lib/types';
import { queryKeys } from '@/lib/queryKeys';

export function useDocuments(filters?: {
  filename?: string;
  tags?: string[];
  mode?: 'AND' | 'OR';
}) {
  const params = new URLSearchParams();
  if (filters?.filename) params.set('filename', filters.filename);
  if (filters?.tags && filters.tags.length > 0) {
    // カンマ区切り指定（繰り返しでも可だがここではカンマに統一）
    params.set('tag', filters.tags.join(','));
  }
  if (filters?.mode) {
    params.set('mode', filters.mode.toLowerCase());
  }
  const query = params.toString();
  return useQuery<{ documents: DocumentItem[] }>({
    queryKey: [
      ...queryKeys.documents,
      {
        filename: filters?.filename || '',
        tags: filters?.tags || [],
        mode: filters?.mode || 'AND',
      },
    ],
    queryFn: () => apiFetch(`/documents${query ? `?${query}` : ''}`),
    staleTime: 10_000,
  });
}

export function useDocumentStatus(documentId?: string) {
  return useQuery<{ document: DocumentItem | null }>({
    queryKey: queryKeys.documentStatus(documentId || ''),
    queryFn: () => apiFetch(`/documents/${documentId}`),
    enabled: !!documentId,
    refetchInterval: 3000,
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      return apiFetch(`/documents/${documentId}`, { method: 'DELETE' });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.documents });
    },
  });
}

export function useUpdateDocumentTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { documentId: string; tags: string[]; source?: 'USER' | 'AUTO' }) => {
      return apiFetch(`/documents/${payload.documentId}/tags`, {
        method: 'PATCH',
        body: JSON.stringify({ tags: payload.tags, source: payload.source ?? 'USER' }),
      });
    },
    onSuccess: async (_, variables) => {
      await qc.invalidateQueries({ queryKey: queryKeys.documents });
      await qc.invalidateQueries({ queryKey: queryKeys.documentStatus(variables.documentId) });
    },
    retry: 0,
  });
}


