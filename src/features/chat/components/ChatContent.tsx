"use client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

  // 実際に使用するセッションID
  const effectiveSessionId = localSessionId ?? sessionId;

  // ★ ストリーミング中のデータを保持するref（onFinishで使用）
  const streamingDataRef = useRef<{
    userQuery: string;
    aiResponse: string;
    citations: SourceDocument[];
  } | null>(null);

  // ========================================
  // Transport設定
  // ========================================
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/stream`,
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

  // ========================================
  // useChat
  // ========================================
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
      console.log("message", JSON.stringify(message, null, 2));
      // ★ message.parts からセッション情報を抽出
      const sessionInfo = extractSessionInfoFromMessage(message);
      console.log("sessionInfo", JSON.stringify(sessionInfo, null, 2));

      if (sessionInfo && streamingDataRef.current) {
        const { userQuery, aiResponse, citations } = streamingDataRef.current;
        const { historyId, createdAt } = sessionInfo;

        // ★ 新しいメッセージを作成
        const newMessage: MessageSummary = {
          historyId,
          userQuery,
          aiResponse,
          sourceDocuments: citations,
          feedback: FeedbackType.NONE,
          createdAt,
        };

        // ★ キャッシュを直接更新（GETリクエストなし！）
        queryClient.setQueryData<{ pages: GetSessionMessagesResponse[] }>(
          queryKeys.sessionMessages(effectiveSessionId ?? ""),
          (oldData) => {
            if (!oldData) {
              // キャッシュがない場合は新規作成
              return {
                pages: [
                  {
                    sessionId: effectiveSessionId ?? "",
                    messages: [newMessage],
                  },
                ],
                pageParams: [undefined],
              };
            }

            // 最初のページの先頭にメッセージを追加
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

        // streamingDataRefをクリア
        streamingDataRef.current = null;
      }

      // useChatの状態をクリア
      setMessages([]);

      console.log("localSessionId", localSessionId);
      console.log("sessionId", sessionId);

      // URLを更新（新規セッションの場合）
      if (localSessionId && localSessionId !== sessionId) {
        router.replace(`/chat?sessionId=${localSessionId}`, { scroll: false });
      }

      // ★ セッション一覧のみ更新（メッセージ一覧はキャッシュ更新済み）
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

  // ========================================
  // セッション切り替え時のリセット処理
  // ========================================
  useEffect(() => {
    const prevId = prevSessionIdRef.current;
    const currId = sessionId;

    if (prevId !== undefined && currId !== undefined && prevId !== currId) {
      resetForSessionSwitch(currId);
      setMessages([]);
    } else if (prevId !== undefined && currId === undefined) {
      resetForNewSession();
      setMessages([]);
    }

    prevSessionIdRef.current = currId;
  }, [sessionId, resetForSessionSwitch, resetForNewSession, setMessages]);

  // ========================================
  // コンポーネント初期化時にlocalSessionIdを同期
  // ========================================
  useEffect(() => {
    if (sessionId && !localSessionId) {
      setLocalSessionId(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================================
  // エラーハンドリング
  // ========================================
  useEffect(() => {
    if (chatError) {
      showToast({
        type: "error",
        message: chatError.message || "エラーが発生しました。",
      });
    }
  }, [chatError, showToast]);

  // ========================================
  // メッセージ抽出
  // ========================================
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

  // ★ ストリーミングデータをrefに保存（onFinishで使用）
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

  // ========================================
  // 履歴取得
  // ========================================
  const {
    data,
    isLoading: isQueryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useSessionMessages(effectiveSessionId, 30, "desc", {
    enabled:
      !!effectiveSessionId &&
      !isStreamingAnswer &&
      localSessionId === sessionId,
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

  // ========================================
  // 新規セッション作成時のコールバック
  // ========================================
  const handleNewSessionCreated = useCallback(
    (newSessionId: string) => {
      setLocalSessionId(newSessionId);
    },
    [setLocalSessionId]
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
      console.log("body", JSON.stringify(body, null, 2));
      console.log("query", query);
      await sendMessage({ text: query }, { body });
    },
    isStreamingAnswer,
    stop,
    handleNewSessionCreated
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

  // ========================================
  // 表示ロジック
  // ========================================
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
