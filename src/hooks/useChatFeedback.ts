import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { SubmitFeedbackRequest, SubmitFeedbackResponse } from "@/lib/schemas/chat";

export function useChatFeedback() {
  return useMutation({
    mutationFn: (payload: SubmitFeedbackRequest) =>
      apiFetch<SubmitFeedbackResponse>("/chat/feedback", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}
