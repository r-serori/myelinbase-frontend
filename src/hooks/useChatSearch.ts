import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export function useChatSearch() {
  return useMutation({
    mutationFn: (payload: {
      query: string;
      sessionId?: string;
      redoHistoryId?: string;
      signal?: AbortSignal;
    }) =>
      apiFetch("/chat/search/chunks", {
        method: "POST",
        body: JSON.stringify({
          query: payload.query,
          sessionId: payload.sessionId,
          redoHistoryId: payload.redoHistoryId,
        }),
        signal: payload.signal,
      }),
  });
}
