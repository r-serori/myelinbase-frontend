"use client";

import type { RefObject } from "react";
import type { ChatMessage } from "@/lib/types";
import MessageItem from "./MessageItem";
import Spinner from "../ui/Spinner";

type FeedbackMutation = {
  mutate: (args: {
    historyId: string;
    feedback: "GOOD" | "BAD";
    comment?: string;
  }) => void;
};

type ChatMessagesPaneProps = {
  messages: ChatMessage[];
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
};

export default function ChatMessagesPane({
  messages,
  isLoading,
  pendingUserMessage,
  pendingCreatedAt,
  redoingHistoryId,
  streamingAnswer,
  latestUserMessageRef,
  onDoSend,
  feedbackMutation,
}: ChatMessagesPaneProps) {
  return (
    <div className="max-w-3xl w-full mx-auto p-4 pb-10 space-y-3">
      {isLoading && <div className="text-gray-500 text-sm">Loading...</div>}

      {messages.map((m, index) => {
        if (redoingHistoryId && m.historyId === redoingHistoryId) {
          // redo/edit の対象ターンは一時的に非表示にする
          return null;
        }
        const isLatest = index === messages.length - 1;
        return (
          <div
            key={m.historyId}
            className="space-y-1"
            ref={isLatest ? latestUserMessageRef : undefined}
          >
            <MessageItem
              role="user"
              text={m.userQuery}
              createdAt={m.createdAt}
              isLatest={isLatest}
              historyId={m.historyId}
              onCopy={async (text) => {
                if (
                  typeof navigator !== "undefined" &&
                  navigator.clipboard?.writeText
                ) {
                  try {
                    await navigator.clipboard.writeText(text);
                  } catch (err) {
                    console.error("コピーに失敗しました:", err);
                  }
                }
              }}
              onEditAndResend={(newText, historyId) => {
                void onDoSend(newText, { redoHistoryId: historyId });
              }}
            />
            <MessageItem
              role="ai"
              text={m.aiResponse}
              isLatest={isLatest}
              historyId={m.historyId}
              onCopy={async (text) => {
                if (
                  typeof navigator !== "undefined" &&
                  navigator.clipboard?.writeText
                ) {
                  try {
                    await navigator.clipboard.writeText(text);
                  } catch (err) {
                    console.error("コピーに失敗しました:", err);
                  }
                }
              }}
              onRedo={() => {
                void onDoSend(m.userQuery, { redoHistoryId: m.historyId });
              }}
              onGoodFeedback={(historyId) => {
                if (!historyId) return;
                feedbackMutation.mutate({
                  historyId,
                  feedback: "GOOD",
                });
              }}
              onBadFeedback={(historyId, reasons, comment) => {
                if (!historyId) return;
                const reasonText =
                  reasons.length > 0 ? `Reasons: ${reasons.join(", ")}` : "";
                const fullComment = [reasonText, comment]
                  .filter((x) => x && x.trim().length > 0)
                  .join("\n");
                feedbackMutation.mutate({
                  historyId,
                  feedback: "BAD",
                  comment: fullComment || undefined,
                });
              }}
            />
          </div>
        );
      })}

      {/* 楽観的な最新メッセージ表示（送信直後〜レスポンス取得まで） */}
      {pendingUserMessage && (
        <div className="space-y-1">
          <div className="w-full flex justify-start mt-12">
            <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm bg-gray-100 flex items-center gap-2">
              <Spinner />
              <span className="text-xs text-gray-500">
                Myelinが応答を生成しています...
              </span>
            </div>
          </div>
        </div>
      )}

      {streamingAnswer && streamingAnswer.length > 0 && (
        <div className="space-y-1">
          <MessageItem role="ai" text={streamingAnswer} isLatest />
        </div>
      )}

      {messages.length === 0 && !isLoading && !pendingUserMessage && (
        <div className="text-gray-500 text-sm">メッセージはありません。</div>
      )}
    </div>
  );
}
