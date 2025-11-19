import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

type FeedbackPayload = {
  historyId: string;
  feedback: "GOOD" | "BAD";
  comment?: string;
};

export function useChatFeedback() {
  return useMutation({
    mutationFn: (payload: FeedbackPayload) =>
      apiFetch("/chat/feedback", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}


