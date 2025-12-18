import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type {
  GetSessionsResponse,
  UpdateSessionNameRequest,
  UpdateSessionNameResponse,
  DeleteSessionResponse,
} from "@/lib/schemas/chat";
import { queryKeys } from "@/lib/queryKeys";

export function useSessions() {
  return useQuery<GetSessionsResponse>({
    queryKey: queryKeys.sessions,
    queryFn: () => apiFetch<GetSessionsResponse>("/chat/sessions"),
    staleTime: 10_000,
  });
}

export function useUpdateSessionName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { sessionId: string; sessionName: string }) => {
      const body: UpdateSessionNameRequest = {
        sessionName: payload.sessionName,
      };
      return apiFetch<UpdateSessionNameResponse>(
        `/chat/sessions/${payload.sessionId}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      return apiFetch<DeleteSessionResponse>(`/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}
