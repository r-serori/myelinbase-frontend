import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { SessionMessagesResponse } from "@/lib/types";
import { queryKeys } from "@/lib/queryKeys";

export function useSessionMessages(
  sessionId: string | undefined,
  limit = 30,
  order: "asc" | "desc" = "desc"
) {
  return useInfiniteQuery<SessionMessagesResponse>({
    queryKey: queryKeys.sessionMessages(sessionId || ""),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const cursorParam =
        pageParam == null
          ? ""
          : `&cursor=${encodeURIComponent(pageParam as string)}`;
      return apiFetch(
        `/chat/session/${sessionId}?limit=${limit}&order=${order}${cursorParam}`
      );
    },
    getNextPageParam: (last) => last.nextToken ?? undefined,
    staleTime: 60_000,
    gcTime: 600_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!sessionId,
  });
}
