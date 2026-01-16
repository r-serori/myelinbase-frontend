import { useQueryClient } from "@tanstack/react-query";

import {
  getGetChatSessionsQueryKey,
  useDeleteChatSessionsSessionId,
  useGetChatSessions,
  usePatchChatSessionsSessionId,
} from "@/lib/api/generated/default/default";

export function useSessions() {
  return useGetChatSessions({
    query: {
      staleTime: 10_000,
    },
  });
}

export function useUpdateSessionName() {
  const qc = useQueryClient();
  const mutation = usePatchChatSessionsSessionId({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetChatSessionsQueryKey() });
      },
    },
  });

  return {
    ...mutation,
    mutateAsync: async (payload: {
      sessionId: string;
      sessionName: string;
    }) => {
      return mutation.mutateAsync({
        sessionId: payload.sessionId,
        data: { sessionName: payload.sessionName },
      });
    },
  };
}

export function useDeleteSession() {
  const qc = useQueryClient();
  const mutation = useDeleteChatSessionsSessionId({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetChatSessionsQueryKey() });
      },
    },
  });

  return {
    ...mutation,
    mutateAsync: async (sessionId: string) => {
      return mutation.mutateAsync({ sessionId });
    },
  };
}
