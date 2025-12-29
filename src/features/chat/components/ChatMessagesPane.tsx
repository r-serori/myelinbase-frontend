"use client";

import type { RefObject } from "react";
import Image from "next/image";

import { useAuth } from "@/features/auth/providers/AuthProvider";
import AiMessage from "@/features/chat/components/message/AiMessage";
import UserMessage from "@/features/chat/components/message/UserMessage";
import { useMessageGrouping } from "@/features/chat/hooks/useMessageGrouping";
import LightLoading from "@/components/ui/LightLoading";
import { Text } from "@/components/ui/Text";
import { usePostChatFeedback } from "@/lib/api/generated/default/default";
import type { MessageSummary, SourceDocument } from "@/lib/api/generated/model";
import { FeedbackType } from "@/lib/api/generated/model/feedbackType";

type FeedbackMutation = ReturnType<typeof usePostChatFeedback>;

type ChatMessagesPaneProps = {
  sessionId?: string;
  messages: MessageSummary[];
  isLoading: boolean;
  pendingUserMessage: string | null;
  pendingCreatedAt: string | null;
  redoingHistoryId: string | null;
  streamingAnswer: string | null;
  streamingCitations?: SourceDocument[];
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
  streamingCitations,
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
      sourceDocuments: streamingCitations || [],
      feedback: FeedbackType.NONE,
      versionInfo: { current: 1, total: 1, onPrev: () => {}, onNext: () => {} },
    });
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

          // 生成中かどうかの判定
          // pending かつ isStreaming なら生成中
          // または、既存履歴の redo 中なら生成中
          const isGenerating =
            (isStreaming && isPending) ||
            (isStreaming && m.historyId === redoingHistoryId);

          // AI レスポンスの表示内容
          // Redo中は streamingAnswer を優先表示
          const displayAiResponse =
            m.historyId === redoingHistoryId && isStreaming
              ? streamingAnswer || ""
              : isPending
                ? streamingAnswer || ""
                : m.aiResponse || "";

          // ソースドキュメントの表示内容
          // 生成中は streamingCitations を優先表示（あれば）
          const displayDocuments =
            isGenerating && streamingCitations && streamingCitations.length > 0
              ? streamingCitations
              : m.sourceDocuments;

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
                  // Pending状態でもストリーミングが停止していれば再送を許可する
                  if (!isPending || !isStreaming) {
                    // Pendingの場合はhistoryIdがないので新規送信扱いにする
                    const opts = isPending
                      ? undefined
                      : { redoHistoryId: historyId };
                    void onDoSend(newText, opts);
                  }
                }}
              />

              <AiMessage
                text={displayAiResponse}
                createdAt={m.createdAt}
                isLatest={isLatest && current === total}
                historyId={m.historyId}
                isGenerating={isGenerating}
                currentVersion={current}
                totalVersions={total}
                sourceDocuments={displayDocuments}
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
                  if (!isPending || !isStreaming) {
                    const opts = isPending
                      ? undefined
                      : { redoHistoryId: m.historyId };
                    void onDoSend(m.userQuery, opts);
                  }
                }}
                onGoodFeedback={(historyId) => {
                  if (!historyId || !sessionId || isPending) return;
                  feedbackMutation.mutate({
                    data: {
                      sessionId,
                      historyId,
                      createdAt: m.createdAt,
                      evaluation: FeedbackType.GOOD,
                    },
                  });
                }}
                onBadFeedback={(historyId, reasons, comment) => {
                  if (!historyId || !sessionId || isPending) return;
                  feedbackMutation.mutate({
                    data: {
                      sessionId,
                      historyId,
                      createdAt: m.createdAt,
                      evaluation: FeedbackType.BAD,
                      comment: comment,
                      reasons,
                    },
                  });
                }}
              />
            </div>
          );
        })}

      {itemsWithPending.length === 0 && !isLoading && (
        <div className="flex items-center gap-2">
          <Image
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
