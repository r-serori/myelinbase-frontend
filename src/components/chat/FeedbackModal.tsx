import { useState } from "react";

type FeedbackModalProps = {
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selectedReasons || selectedReasons.length === 0) {
      setErrorMessage("少なくとも1つ、当てはまる理由を選択してください。");
      return;
    }

    setErrorMessage(null);
    onSubmit();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold mb-2">
          {feedbackType === "good"
            ? "良い回答のフィードバック"
            : "悪い回答のフィードバック"}
        </h2>
        <p className="text-xs text-gray-500 mb-2">
          回答について、当てはまる項目とコメントを教えてください。
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {(feedbackType === "good" ? goodReasons : badReasons).map(
            (reason, index) => {
              const active = selectedReasons.includes(reason);
              return (
                <button
                  id={`feedback-reason-${index}`}
                  key={reason}
                  type="button"
                  onClick={() => {
                    if (errorMessage) {
                      setErrorMessage(null);
                    }
                    onToggleReason(reason);
                  }}
                  className={`text-xs px-2 py-1 rounded-full border ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {reason}
                </button>
              );
            }
          )}
        </div>
        {errorMessage && (
          <p className="text-xs text-red-500 mb-2">{errorMessage}</p>
        )}
        <textarea
          className="w-full border rounded-md p-2 text-xs mb-3 resize-none overflow-hidden"
          rows={8}
          placeholder="自由記述のフィードバック（任意）"
          value={feedbackComment}
          onChange={(e) => onChangeComment(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="text-xs px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="text-xs px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={handleSubmit}
            disabled={!feedbackType}
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
