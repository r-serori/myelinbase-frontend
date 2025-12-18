"use client";
import { useSessionMessages } from "@/hooks/useSessionMessages";
import { useChatFeedback } from "@/hooks/useChatFeedback";
import { useChatGeneration } from "@/hooks/useChatGeneration";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ChatInput from "./ChatInput";
import ChatMessagesPane from "./ChatMessagesPane";
import { MessageSummary, SourceDocument } from "@/lib/schemas/chat";
import { getErrorMessage } from "@/lib/error-mapping";
import { useGetDocumentDownloadUrl } from "@/hooks/useDocuments";
import { useToast } from "../ui/ToastProvider";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useChatForm } from "@/hooks/useChatForm";

export default function ChatWindow({
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
  const router = useRouter();

  // 1. Data Fetching
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useSessionMessages(sessionId);
  useQueryErrorToast(isError, error);

  const feedbackMutation = useChatFeedback();
  const getDownloadUrl = useGetDocumentDownloadUrl();

  const {
    generate,
    stop,
    isLoading: isStreamingAnswer,
    streamingText: streamingAnswer,
    userQuery,
    createdAt: streamingCreatedAt,
    error: streamError,
  } = useChatGeneration(sessionId);

  // 2. Local State
  const [completedHistoryId, setCompletedHistoryId] = useState<string | null>(
    null
  );
  const [redoingHistoryId, setRedoingHistoryId] = useState<string | null>(null);

  const pendingUserMessage = userQuery;
  const pendingCreatedAt = streamingCreatedAt;

  // 3. Effects
  useEffect(() => {
    if (streamError) {
      showToast({ type: "error", message: getErrorMessage(streamError) });
    }
  }, [streamError, showToast]);

  const prevSessionIdRef = useRef(sessionId);
  // セッション切り替え時のリセット処理は useChatForm 側で input をリセットする機能が必要かも
  // ただし、Inputの状態は useChatForm が持っている

  // 4. Custom Hooks
  // Scroll Logic
  const { scrollRef, onScroll } = useChatScroll(
    data?.pages?.length,
    sessionId,
    isStreamingAnswer,
    streamingAnswer,
    pendingUserMessage,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  );

  // Form & Action Logic
  const onGenerateDone = useCallback(() => {
    setCompletedHistoryId(null);
    setRedoingHistoryId(null);
  }, []);

  const {
    input,
    setInput,
    isExpanded,
    setIsExpanded,
    formHeight,
    formRef,
    inputRef,
    doSend,
    isRecording,
    toggleRecording,
  } = useChatForm(sessionId, generate, stop, isStreamingAnswer, onGenerateDone);

  // セッション切り替え時のリセット（Inputのリセット）
  useEffect(() => {
    if (prevSessionIdRef.current !== sessionId) {
      prevSessionIdRef.current = sessionId;
      setCompletedHistoryId(null);
      setRedoingHistoryId(null);
      setInput(""); // useChatFormのsetInputを呼ぶ
    }
  }, [sessionId, setInput]);

  const messages: MessageSummary[] =
    data?.pages.flatMap((page) => page.messages).reverse() ?? [];

  const isMessagePersisted = messages.some(
    (m) => m.historyId === completedHistoryId
  );

  const showPending =
    (pendingUserMessage || isStreamingAnswer) &&
    (!completedHistoryId || !isMessagePersisted);

  useEffect(() => {
    if (completedHistoryId && isMessagePersisted) {
      setCompletedHistoryId(null);
    }
  }, [completedHistoryId, isMessagePersisted]);

  // Actions
  const handleDoSend = async (
    overrideQuery?: string,
    options?: { redoHistoryId?: string }
  ) => {
    setCompletedHistoryId(null);
    if (options?.redoHistoryId) {
      setRedoingHistoryId(options.redoHistoryId);
    }

    try {
      await doSend(overrideQuery, options);
    } catch (e) {
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
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      showToast({ type: "error", message: getErrorMessage(e) });
    }
  };

  return (
    <div className="w-full flex flex-col relative h-full overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto w-full h-full"
        onScroll={onScroll}
      >
        <ChatMessagesPane
          key={sessionId}
          sessionId={sessionId}
          messages={messages}
          isLoading={isLoading}
          pendingUserMessage={showPending ? pendingUserMessage : null}
          pendingCreatedAt={pendingCreatedAt}
          redoingHistoryId={redoingHistoryId}
          streamingAnswer={streamingAnswer}
          latestUserMessageRef={useRef(null)} // Scroll logic handles scrolling, ref not strictly needed here unless for specific focus
          onDoSend={handleDoSend}
          feedbackMutation={feedbackMutation}
          bottomPadding={formHeight + 80}
          formHeight={formHeight}
          isStreaming={isStreamingAnswer}
          onSourceClick={handleSourceClick}
        />
      </div>

      <ChatInput
        key={sessionId}
        isDocumentPreviewOpen={isDocumentPreviewOpen}
        input={input}
        onChangeInput={setInput}
        onSubmitByEnter={async () => await handleDoSend()}
        onClickSendButton={async () => {
          if (isLoading) return;
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
