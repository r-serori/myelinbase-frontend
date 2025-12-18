"use client";

import { useChatGenerationContext } from "@/contexts/ChatGenerationContext";
import { ChatStreamRequest } from "@/lib/schemas/chat";

export function useChatGeneration(sessionId: string | undefined) {
  const context = useChatGenerationContext();

  // sessionId が undefined の場合は "pending" として扱う（新規チャット用）
  const targetId = sessionId || "pending";
  const state = context.getGenerationState(targetId);

  const generate = async (
    payload: ChatStreamRequest,
    options?: {
      onDone?: (sessionId: string) => void;
      onSessionIdReceived?: (sessionId: string) => void;
    }
  ) => {
    return context.startGeneration(payload, options);
  };

  const stop = () => {
    context.abortGeneration(targetId);
  };

  return {
    ...state,
    generate,
    stop,
  };
}
