import { useInfiniteQuery } from "@tanstack/react-query";

import { getChatSessionsSessionId } from "@/lib/api/generated/default/default";
import { queryKeys } from "@/lib/queryKeys";

export function useSessionMessages(
  sessionId: string | undefined,
  limit = 30,
  order: "asc" | "desc" = "desc",
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.sessionMessages(sessionId ?? ""), { limit, order }],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) => {
      const response = await getChatSessionsSessionId(
        sessionId!,
        {
          limit: String(limit),
          order,
          cursor: pageParam || undefined,
        },
        undefined,
        signal
      );
      return response;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: options?.enabled !== undefined ? options.enabled : !!sessionId,
  });
}
