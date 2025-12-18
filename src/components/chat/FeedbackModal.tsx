import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Text } from "../ui/Text";
import { Button } from "../ui/Button";
import { useToast } from "../ui/ToastProvider";

type FeedbackModalProps = {
  isOpen: boolean;
  feedbackType: "good" | "bad";
  goodReasons: string[];
  badReasons: string[];
  selectedReasons: string[];
  feedbackComment: string;
  onToggleReason: (reason: string) => void;
  onChangeComment: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function FeedbackModal({
  isOpen,
  feedbackType,
  goodReasons,
  badReasons,
  selectedReasons,
  feedbackComment,
  onToggleReason,
  onChangeComment,
  onClose,
  onSubmit,
}: FeedbackModalProps) {
  const { showToast } = useToast();

  const handleSubmit = () => {
    if (!selectedReasons || selectedReasons.length === 0) {
      showToast({
        type: "error",
        message: "少なくとも1つ、当てはまる理由を選択してください。",
      });
      return;
    }

    onSubmit();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        feedbackType === "good"
          ? "良い回答のフィードバック"
          : "悪い回答のフィードバック"
      }
    >
      <Text variant="sm" color="muted" leading="relaxed">
        回答について、当てはまる項目とコメントを教えてください。
      </Text>
      <div className="flex flex-wrap gap-2 py-3">
        {(feedbackType === "good" ? goodReasons : badReasons).map(
          (reason, index) => {
            const active = selectedReasons.includes(reason);
            return (
              <Button
                id={`feedback-reason-${index}`}
                key={reason}
                variant="outlineBlack"
                size="xs"
                onClick={() => {
                  onToggleReason(reason);
                }}
                className={`rounded-full ${
                  active &&
                  "bg-primary text-primary-foreground border-primary hover:bg-primary/80 hover:text-primary-foreground"
                }`}
              >
                {reason}
              </Button>
            );
          }
        )}
      </div>
      <textarea
        className="w-full border rounded-md p-2 text-sm mb-3 resize-none overflow-hidden"
        rows={8}
        placeholder="自由記述のフィードバック（任意）"
        value={feedbackComment}
        onChange={(e) => onChangeComment(e.target.value)}
      />
      <div className="flex justify-end gap-4">
        <Button variant="outline" size="sm" onClick={onClose}>
          キャンセル
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!selectedReasons || selectedReasons.length === 0}
        >
          送信
        </Button>
      </div>
    </Modal>
  );
}
