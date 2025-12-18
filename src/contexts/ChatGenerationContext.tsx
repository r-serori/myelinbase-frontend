"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getJwt } from "@/lib/auth";
import { queryKeys } from "@/lib/queryKeys";
import type {
  ChatStreamRequest,
  GetSessionsResponse,
  SessionSummary,
} from "@/lib/schemas/chat";
import { processChatStream } from "@/lib/stream-utils";

// セッションごとの生成状態
export interface GenerationState {
  sessionId: string;
  isLoading: boolean;
  streamingText: string;
  userQuery: string | null;
  createdAt: string | null;
  error: string | null;
  abortController: AbortController | null;
}

interface ChatGenerationContextType {
  getGenerationState: (sessionId: string) => GenerationState;
  startGeneration: (
    payload: ChatStreamRequest,
    options?: {
      onDone?: (sessionId: string) => void;
      onSessionIdReceived?: (sessionId: string) => void;
    }
  ) => Promise<void>;
  abortGeneration: (sessionId: string) => void;
  isGenerating: (sessionId: string) => boolean;
}

const ChatGenerationContext = createContext<ChatGenerationContextType | null>(
  null
);

export function useChatGenerationContext() {
  const context = useContext(ChatGenerationContext);
  if (!context) {
    throw new Error(
      "useChatGenerationContext must be used within a ChatGenerationProvider"
    );
  }
  return context;
}

export function ChatGenerationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const qc = useQueryClient();

  const [states, setStates] = useState<Record<string, GenerationState>>({});

  const updateState = useCallback(
    (sessionId: string, newState: Partial<GenerationState>) => {
      setStates((prev) => ({
        ...prev,
        [sessionId]: {
          ...(prev[sessionId] || {
            sessionId,
            isLoading: false,
            streamingText: "",
            userQuery: null,
            createdAt: null,
            error: null,
            abortController: null,
          }),
          ...newState,
        },
      }));
    },
    []
  );

  const getGenerationState = useCallback(
    (sessionId: string): GenerationState => {
      return (
        states[sessionId] || {
          sessionId,
          isLoading: false,
          streamingText: "",
          userQuery: null,
          createdAt: null,
          error: null,
          abortController: null,
        }
      );
    },
    [states]
  );

  const isGenerating = useCallback(
    (sessionId: string) => {
      return states[sessionId]?.isLoading || false;
    },
    [states]
  );

  const abortGeneration = useCallback(
    (sessionId: string) => {
      const state = states[sessionId];
      if (state?.abortController) {
        state.abortController.abort();
      }
      updateState(sessionId, { isLoading: false, abortController: null });
    },
    [states, updateState]
  );

  const startGeneration = useCallback(
    async (
      payload: ChatStreamRequest,
      options?: {
        onDone?: (sessionId: string) => void;
        onSessionIdReceived?: (sessionId: string) => void;
      }
    ) => {
      let targetSessionId = payload.sessionId || "pending";

      abortGeneration(targetSessionId);

      const abortController = new AbortController();

      // ★ 初期状態セット
      updateState(targetSessionId, {
        isLoading: true,
        streamingText: "",
        userQuery: payload.query,
        createdAt: new Date().toISOString(),
        error: null,
        abortController,
      });

      // ★ 楽観的UI更新
      qc.setQueryData<GetSessionsResponse>(queryKeys.sessions, (oldData) => {
        if (!oldData) return oldData;
        const newSession: SessionSummary = {
          sessionId: targetSessionId,
          sessionName:
            payload.query.length > 20
              ? `${payload.query.slice(0, 20)}...`
              : payload.query,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        };
        return {
          ...oldData,
          sessions: [
            newSession,
            ...oldData.sessions.filter((s) => s.sessionId !== targetSessionId),
          ],
        };
      });

      try {
        const token = await getJwt();
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          (headers as any)["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/stream`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: abortController.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        await processChatStream(response, {
          onText: (text) => {
            setStates((prev) => {
              const current = prev[targetSessionId];
              return {
                ...prev,
                [targetSessionId]: {
                  ...current,
                  streamingText: (current?.streamingText || "") + text,
                },
              };
            });
          },
          onSessionId: (newSid) => {
            if (newSid && newSid !== targetSessionId) {
              setStates((prev) => {
                const pendingState = prev[targetSessionId];
                if (!pendingState) return prev;

                const nextStates = { ...prev };
                delete nextStates[targetSessionId];
                nextStates[newSid] = {
                  ...pendingState,
                  sessionId: newSid,
                };
                return nextStates;
              });

              targetSessionId = newSid;
              if (options?.onSessionIdReceived) {
                options.onSessionIdReceived(newSid);
              }
            }
          },
          onDone: async (finalSessionId) => {
            const sid = finalSessionId || targetSessionId;
            if (sid) {
              await qc.invalidateQueries({ queryKey: queryKeys.sessions });
              await qc.invalidateQueries({
                queryKey: queryKeys.sessionMessages(sid),
              });
            }
            updateState(targetSessionId, {
              isLoading: false,
              userQuery: null,
              createdAt: null,
              streamingText: "",
              abortController: null,
            });
            if (options?.onDone && sid) options.onDone(sid);
          },
          onError: (err) => {
            throw err;
          },
        });
      } catch (error: any) {
        if (error.name === "AbortError") return;
        updateState(targetSessionId, {
          isLoading: false,
          error: error.message || "Error occurred",
          abortController: null,
          userQuery: null,
          createdAt: null,
        });
      }
    },
    [abortGeneration, updateState, qc]
  );

  return (
    <ChatGenerationContext.Provider
      value={{
        getGenerationState,
        startGeneration,
        abortGeneration,
        isGenerating,
      }}
    >
      {children}
    </ChatGenerationContext.Provider>
  );
}
