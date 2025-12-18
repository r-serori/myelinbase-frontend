import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { GetSessionMessagesResponse } from "@/lib/schemas/chat";
import { queryKeys } from "@/lib/queryKeys";

export function useSessionMessages(
  sessionId: string | undefined,
  limit = 30,
  order: "asc" | "desc" = "desc"
) {
  return useInfiniteQuery<GetSessionMessagesResponse>({
    queryKey: queryKeys.sessionMessages(sessionId || ""),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const cursorParam =
        pageParam == null
          ? ""
          : `&cursor=${encodeURIComponent(pageParam as string)}`;
      // バックエンドのエンドポイントパスに合わせて修正: /chat/session/:id -> /chat/sessions/:id
      return apiFetch<GetSessionMessagesResponse>(
        `/chat/sessions/${sessionId}?limit=${limit}&order=${order}${cursorParam}`
      );
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60_000,
    gcTime: 600_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!sessionId,
  });
}
