import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { SessionSummary } from "@/lib/types";
import { queryKeys } from "@/lib/queryKeys";

export function useSessions() {
  return useQuery<{ sessions: SessionSummary[] }>({
    queryKey: queryKeys.sessions,
    queryFn: () => apiFetch("/chat/sessions"),
    staleTime: 10_000,
  });
}
