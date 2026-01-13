"use client";
import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";

import { getJwt } from "@/features/auth/lib/auth";
import ChatInput from "@/features/chat/components/ChatInput";
import ChatMessagesPane from "@/features/chat/components/ChatMessagesPane";
import { useChatFeedback } from "@/features/chat/hooks/useChatFeedback";
import { useChatForm } from "@/features/chat/hooks/useChatForm";
import { useChatScroll } from "@/features/chat/hooks/useChatScroll";
import { useChatStore } from "@/features/chat/hooks/useChatStore";
import { useSessionMessages } from "@/features/chat/hooks/useSessionMessages";
import {
  extractCitationsFromMessage,
  extractSessionInfoFromMessage,
  extractTextFromMessage,
} from "@/features/chat/lib/utils";
import { useGetDocumentDownloadUrl } from "@/features/documents/hooks/useDocuments";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import {
  ErrorResponse,
  FeedbackType,
  GetSessionMessagesResponse,
  MessageSummary,
  SourceDocument,
} from "@/lib/api/generated/model";
import { env } from "@/lib/env";
import { getErrorMessage } from "@/lib/error-mapping";
import { queryKeys } from "@/lib/queryKeys";

import { useToast } from "@/providers/ToastProvider";

export default function ChatContent({
  sessionId,
  sidebarCollapsed,
  isDocumentPreviewOpen,
  onSourceClick,
}: {
  sessionId?: string;
  sidebarCollapsed: boolean;
  isDocumentPreviewOpen: boolean;
  onSourceClick?: (doc: SourceDocument) => void;
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const {
    localSessionId,
    setLocalSessionId,
    input,
    setInput,
    redoingHistoryId,
    setRedoingHistoryId,
    resetForNewSession,
    resetForSessionSwitch,
  } = useChatStore();

  const prevSessionIdRef = useRef<string | undefined>(sessionId);

  const effectiveSessionId = localSessionId ?? sessionId;

  const streamingDataRef = useRef<{
    userQuery: string;
    aiResponse: string;
    citations: SourceDocument[];
  } | null>(null);

  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: `${env.NEXT_PUBLIC_CHAT_AGENT_URL}/chat/stream`,
      headers: async (): Promise<Record<string, string>> => {
        const token = await getJwt();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
      },
      body: () => ({
        sessionId: effectiveSessionId,
      }),
    });
  }, [effectiveSessionId]);

  const {
    messages: chatMessages,
    sendMessage,
    status,
    stop,
    setMessages,
    error: chatError,
  } = useChat({
    transport,
    onFinish: ({ message }) => {
      const sessionInfo = extractSessionInfoFromMessage(message);
      const sessionInfoSessionId = sessionInfo?.sessionId;

      if (sessionInfo && streamingDataRef.current) {
        const { userQuery, aiResponse, citations } = streamingDataRef.current;
        const { historyId, createdAt } = sessionInfo;

        if (sessionInfoSessionId) {
          setLocalSessionId(sessionInfoSessionId);
        }

        const newMessage: MessageSummary = {
          historyId,
          userQuery,
          aiResponse,
          sourceDocuments: citations,
          feedback: FeedbackType.NONE,
          createdAt,
        };

        const targetSessionId =
          sessionInfoSessionId ?? effectiveSessionId ?? "";

        queryClient.setQueryData<{ pages: GetSessionMessagesResponse[] }>(
          queryKeys.sessionMessages(targetSessionId),
          (oldData) => {
            if (!oldData) {
              return {
                pages: [
                  {
                    sessionId: targetSessionId,
                    messages: [newMessage],
                  },
                ],
                pageParams: [undefined],
              };
            }

            const newPages = [...oldData.pages];
            if (newPages.length > 0) {
              newPages[0] = {
                ...newPages[0],
                messages: [newMessage, ...newPages[0].messages],
              };
            }

            return { ...oldData, pages: newPages };
          }
        );

        streamingDataRef.current = null;
      }

      setMessages([]);

      const finalSessionId = sessionInfoSessionId ?? localSessionId;
      if (finalSessionId && finalSessionId !== sessionId) {
        const newUrl = `/chat?sessionId=${finalSessionId}`;
        window.history.replaceState(
          { ...window.history.state, as: newUrl, url: newUrl },
          "",
          newUrl
        );
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions,
      });
    },
    onError: (error) => {
      streamingDataRef.current = null;
      showToast({
        type: "error",
        message:
          error.message || "チャットの送信に失敗しました。再度お試しください。",
      });
    },
  });

  const isStreamingAnswer = status === "streaming" || status === "submitted";

  useEffect(() => {
    const prevId = prevSessionIdRef.current;
    const currId = sessionId;

    if (prevId !== undefined && currId !== undefined && prevId !== currId) {
      // セッション切り替え（既存セッション → 別の既存セッション）
      resetForSessionSwitch(currId);
      setMessages([]);
    } else if (prevId !== undefined && currId === undefined) {
      // 新規チャットへ遷移（既存セッション → 新規）
      resetForNewSession();
      setMessages([]);
    } else if (prevId === undefined && currId !== undefined) {
      // 初期表示から既存セッションへ遷移（新規 → 既存セッション）
      resetForSessionSwitch(currId);
      setMessages([]);
    }

    prevSessionIdRef.current = currId;
  }, [sessionId, resetForSessionSwitch, resetForNewSession, setMessages]);

  useEffect(() => {
    if (sessionId && !localSessionId) {
      setLocalSessionId(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatError) {
      showToast({
        type: "error",
        message: chatError.message || "エラーが発生しました。",
      });
    }
  }, [chatError, showToast]);

  const latestAiMessage = chatMessages.findLast((m) => m.role === "assistant");
  const latestUserMessage = chatMessages.findLast((m) => m.role === "user");

  const streamingCitations = useMemo(() => {
    if (!latestAiMessage) return undefined;
    return extractCitationsFromMessage(latestAiMessage);
  }, [latestAiMessage]);

  const streamingAnswer = latestAiMessage
    ? extractTextFromMessage(latestAiMessage)
    : null;

  const pendingUserMessage = latestUserMessage
    ? extractTextFromMessage(latestUserMessage)
    : null;

  useEffect(() => {
    if (isStreamingAnswer && pendingUserMessage) {
      streamingDataRef.current = {
        userQuery: pendingUserMessage,
        aiResponse: streamingAnswer || "",
        citations: streamingCitations || [],
      };
    }
  }, [
    isStreamingAnswer,
    pendingUserMessage,
    streamingAnswer,
    streamingCitations,
  ]);

  const {
    data,
    isLoading: isQueryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useSessionMessages(effectiveSessionId, 30, "desc", {
    enabled: !!effectiveSessionId && !isStreamingAnswer,
  });

  useQueryErrorToast(isError, error);

  const feedbackMutation = useChatFeedback();
  const getDownloadUrl = useGetDocumentDownloadUrl();

  const messages: MessageSummary[] =
    data?.pages.flatMap((page) => page.messages).reverse() ?? [];

  const { scrollRef, onScroll } = useChatScroll(
    data?.pages?.length,
    effectiveSessionId,
    isStreamingAnswer,
    streamingAnswer,
    pendingUserMessage,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  );

  const {
    isExpanded,
    setIsExpanded,
    formHeight,
    formRef,
    inputRef,
    doSend,
    isRecording,
    toggleRecording,
  } = useChatForm(
    effectiveSessionId,
    input,
    setInput,
    async ({ body, query }) => {
      await sendMessage({ text: query }, { body });
    },
    isStreamingAnswer,
    stop
  );

  const handleDoSend = async (
    overrideQuery?: string,
    options?: { redoHistoryId?: string }
  ) => {
    if (options?.redoHistoryId) {
      setRedoingHistoryId(options.redoHistoryId);
      setMessages([]);
    } else {
      setRedoingHistoryId(null);
      if (!isStreamingAnswer) {
        setMessages([]);
      }
    }

    try {
      await doSend(overrideQuery, options);
    } catch {
      setRedoingHistoryId(null);
    }
  };

  const handleSourceClick = async (doc: SourceDocument) => {
    if (onSourceClick) {
      onSourceClick(doc);
      return;
    }
    if (!doc.documentId) return;
    try {
      const { downloadUrl } = await getDownloadUrl.mutateAsync(doc.documentId);
      let targetUrl = downloadUrl;
      if (targetUrl.includes("localstack")) {
        targetUrl = targetUrl.replace("localstack", "localhost");
      }
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      showToast({
        type: "error",
        message: getErrorMessage((err as ErrorResponse).errorCode),
      });
    }
  };

  const lastDbMessage = messages[messages.length - 1];
  const isDuplicate =
    !!lastDbMessage &&
    lastDbMessage.userQuery === pendingUserMessage &&
    lastDbMessage.aiResponse === streamingAnswer;

  const showPending = !!pendingUserMessage && !isDuplicate;

  const hasPendingContent =
    showPending && (!!pendingUserMessage || !!streamingAnswer);
  const shouldShowLoading =
    isQueryLoading && !isStreamingAnswer && !hasPendingContent;

  const latestUserMessageRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="w-full flex flex-col relative h-full overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto w-full h-full"
        onScroll={onScroll}
      >
        <ChatMessagesPane
          sessionId={effectiveSessionId}
          messages={messages}
          isLoading={shouldShowLoading}
          pendingUserMessage={showPending ? pendingUserMessage : null}
          pendingCreatedAt={null}
          redoingHistoryId={redoingHistoryId}
          streamingAnswer={showPending ? streamingAnswer : null}
          streamingCitations={showPending ? streamingCitations : undefined}
          latestUserMessageRef={latestUserMessageRef}
          onDoSend={handleDoSend}
          feedbackMutation={feedbackMutation}
          bottomPadding={formHeight + 80}
          formHeight={formHeight}
          isStreaming={isStreamingAnswer}
          onSourceClick={handleSourceClick}
        />
      </div>

      <ChatInput
        isDocumentPreviewOpen={isDocumentPreviewOpen}
        input={input}
        onChangeInput={setInput}
        onSubmitByEnter={async () => await handleDoSend()}
        onClickSendButton={async () => {
          if (shouldShowLoading) return;
          if (isStreamingAnswer) {
            stop();
            return;
          }
          if (input.trim().length > 0 && !isRecording) {
            await handleDoSend();
          } else {
            toggleRecording();
          }
        }}
        sidebarCollapsed={sidebarCollapsed}
        isExpanded={isExpanded}
        onToggleExpanded={setIsExpanded}
        isStreamingAnswer={isStreamingAnswer}
        isRecording={isRecording}
        formRef={formRef}
        inputRef={inputRef}
      />
    </div>
  );
}
