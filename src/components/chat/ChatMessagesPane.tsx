"use client";

import type { RefObject } from "react";
import type { MessageSummary, SourceDocument } from "@/lib/schemas/chat";
import { Text } from "../ui/Text";
import LightLoading from "../ui/LightLoading";
import { useAuth } from "../../contexts/AuthContext";
import { useMessageGrouping } from "@/hooks/useMessageGrouping";
import UserMessage from "./message/UserMessage";
import AiMessage from "./message/AiMessage";

type FeedbackMutation = {
  mutate: (args: any) => void;
};

type ChatMessagesPaneProps = {
  sessionId?: string;
  messages: MessageSummary[];
  isLoading: boolean;
  pendingUserMessage: string | null;
  pendingCreatedAt: string | null;
  redoingHistoryId: string | null;
  streamingAnswer: string | null;
  latestUserMessageRef: RefObject<HTMLDivElement | null>;
  onDoSend: (
    overrideQuery: string,
    options?: { redoHistoryId?: string }
  ) => Promise<void>;
  feedbackMutation: FeedbackMutation;
  bottomPadding: number;
  formHeight: number;
  isStreaming: boolean;
  onSourceClick: (doc: SourceDocument) => void;
};

export default function ChatMessagesPane({
  sessionId,
  messages,
  isLoading,
  pendingUserMessage,
  pendingCreatedAt,
  redoingHistoryId,
  streamingAnswer,
  latestUserMessageRef,
  onDoSend,
  feedbackMutation,
  bottomPadding,
  formHeight,
  isStreaming,
  onSourceClick,
}: ChatMessagesPaneProps) {
  const { user } = useAuth();
  const { displayItems } = useMessageGrouping(messages);

  // Pending Message の追加
  const itemsWithPending = [...displayItems];
  if (pendingUserMessage) {
    itemsWithPending.push({
      historyId: "pending",
      userQuery: pendingUserMessage,
      aiResponse: streamingAnswer || "",
      createdAt: pendingCreatedAt || new Date().toISOString(),
      sourceDocuments: [],
      feedback: "NONE",
      versionInfo: { current: 1, total: 1, onPrev: () => {}, onNext: () => {} },
    } as any);
  }

  const lastItemMinHeight = `calc(100vh - ${formHeight}px - 120px)`;

  return (
    <div
      className="max-w-3xl w-full mx-auto p-4 space-y-6"
      style={{ paddingBottom: `${bottomPadding}px` }}
    >
      {isLoading && <LightLoading isLoading={isLoading} />}

      {!isLoading &&
        itemsWithPending.map((m, index) => {
          const isLatest = index === itemsWithPending.length - 1;
          const { current, total, onPrev, onNext } = m.versionInfo;
          const isPending = m.historyId === "pending";

          const isGenerating =
            (isStreaming && isPending && !m.aiResponse) ||
            (isStreaming && m.historyId === redoingHistoryId);

          const displayAiResponse =
            m.historyId === redoingHistoryId && isStreaming
              ? streamingAnswer || ""
              : m.aiResponse || "";

          return (
            <div
              key={`${m.historyId}-${current}`}
              className="space-y-1 relative"
              ref={isLatest ? latestUserMessageRef : undefined}
              style={isLatest ? { minHeight: lastItemMinHeight } : undefined}
            >
              <UserMessage
                text={m.userQuery}
                createdAt={m.createdAt}
                isLatest={isLatest && current === total}
                historyId={m.historyId}
                onCopy={async (text) => {
                  if (
                    typeof navigator !== "undefined" &&
                    navigator.clipboard?.writeText
                  ) {
                    await navigator.clipboard.writeText(text);
                  }
                }}
                onEditAndResend={(newText, historyId) => {
                  if (!isPending) {
                    void onDoSend(newText, { redoHistoryId: historyId });
                  }
                }}
              />

              <AiMessage
                text={displayAiResponse}
                createdAt={m.createdAt} // AI応答の日時も同じでよいか？ 通常は別だがSummary上は同じ
                isLatest={isLatest && current === total}
                historyId={m.historyId}
                isGenerating={isGenerating}
                currentVersion={current}
                totalVersions={total}
                sourceDocuments={m.sourceDocuments}
                onCopy={async (text) => {
                  if (
                    typeof navigator !== "undefined" &&
                    navigator.clipboard?.writeText
                  ) {
                    await navigator.clipboard.writeText(text);
                  }
                }}
                onPrevVersion={onPrev}
                onNextVersion={onNext}
                onSourceClick={onSourceClick}
                onRedo={() => {
                  if (!isPending) {
                    void onDoSend(m.userQuery, { redoHistoryId: m.historyId });
                  }
                }}
                onGoodFeedback={(historyId) => {
                  if (!historyId || !sessionId || isPending) return;
                  feedbackMutation.mutate({
                    sessionId,
                    historyId,
                    createdAt: m.createdAt,
                    evaluation: "GOOD",
                  });
                }}
                onBadFeedback={(historyId, reasons, comment) => {
                  if (!historyId || !sessionId || isPending) return;
                  feedbackMutation.mutate({
                    sessionId,
                    historyId,
                    createdAt: m.createdAt,
                    evaluation: "BAD",
                    comment: comment,
                    reasons,
                  });
                }}
              />
            </div>
          );
        })}

      {itemsWithPending.length === 0 && !isLoading && (
        <div className="flex items-center gap-2">
          <img
            src="/images/icon.png"
            alt="Myelin Base Logo"
            width={32}
            height={32}
          />
          <Text variant="lg" className="pl-1">
            {user?.nickname}さん、こんにちは！
          </Text>
        </div>
      )}
    </div>
  );
}
