"use client";
import { useEffect, useRef, useState } from "react";
import { Copy, Pencil, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import Toast from "../ui/Toast";
import FeedbackModal from "./FeedbackModal";
import ToolTipButton from "../ui/ToolTipButton";

type MessageItemProps = {
  role: "user" | "ai";
  text: string;
  createdAt?: string;
  isLatest?: boolean;
  onCopy?: (text: string) => void;
  onRedo?: () => void;
  historyId?: string;
  onEditAndResend?: (newText: string, historyId: string) => void;
  onGoodFeedback?: (historyId?: string) => void;
  onBadFeedback?: (
    historyId: string | undefined,
    reasons: string[],
    comment: string
  ) => void;
};

export default function MessageItem({
  role,
  text,
  createdAt,
  isLatest,
  onCopy,
  onRedo,
  historyId,
  onEditAndResend,
  onGoodFeedback,
  onBadFeedback,
}: MessageItemProps) {
  const isUser = role === "user";
  const latest = !!isLatest;

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const editRef = useRef<HTMLTextAreaElement | null>(null);
  const [feedbackType, setFeedbackType] = useState<"good" | "bad" | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [goodSubmitted, setGoodSubmitted] = useState(false);
  const [badSubmitted, setBadSubmitted] = useState(false);
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  /**
   * 編集テキストの高さを自動調整する
   */
  useEffect(() => {
    if (isEditing && editRef.current) {
      const el = editRef.current;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [isEditing, editText]);

  /**
   * フィードバックトーストを非表示にする
   */
  useEffect(() => {
    if (!showFeedbackToast) return;
    const timer = setTimeout(() => setShowFeedbackToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showFeedbackToast]);

  /**
   * コピートーストを非表示にする
   */
  useEffect(() => {
    if (!showCopyToast) return;
    const timer = setTimeout(() => setShowCopyToast(false), 2000);
    return () => clearTimeout(timer);
  }, [showCopyToast]);

  const goodReasons = [
    "わかりやすい",
    "思い通りだった",
    "完璧だった",
    "役に立った",
  ];
  const badReasons = [
    "わかりにくい",
    "間違っている",
    "情報が不足している",
    "関係ない回答だった",
  ];

  /**
   * 良い理由または悪い理由を選択する
   * @param reason 選択する理由
   */
  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  /**
   * フィードバックモーダルを閉じる
   */
  const closeFeedback = () => {
    setFeedbackType(null);
    setFeedbackComment("");
    setSelectedReasons([]);
  };

  /**
   * フィードバックを送信する
   */
  const submitFeedback = () => {
    if (feedbackType === "bad" && onBadFeedback) {
      onBadFeedback(historyId, selectedReasons, feedbackComment);
      // 「悪い回答」で確定したので BAD を有効、GOOD を無効にする
      setBadSubmitted(true);
      setGoodSubmitted(false);
      setShowFeedbackToast(true);
    } else {
      console.log("フィードバック送信:", {
        type: feedbackType,
        reasons: selectedReasons,
        comment: feedbackComment,
        message: text,
      });
    }
    closeFeedback();
  };

  /**
   * プロンプトをコピーする
   */
  const handleCopy = async () => {
    if (onCopy) {
      onCopy(text);
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        console.error("コピーに失敗しました:", err);
      }
    }
    setShowCopyToast(true);
  };

  /**
   * プロンプトを編集する
   */
  const handleEditPrompt = () => {
    // 編集開始時に現在のテキストを編集用ステートに反映しておく
    setEditText(text);
    setIsEditing(true);
  };

  /**
   * プロンプトをやり直す
   */
  const handleRedo = () => {
    if (onRedo) {
      onRedo();
    }
  };

  /**
   * 良い評価を送信する
   */
  const handleGood = () => {
    // 良い評価はワンクリックで送信（モーダルは出さない）
    if (onGoodFeedback && historyId) {
      onGoodFeedback(historyId);
    } else {
      console.log("GOOD feedback (local only):", { historyId, text });
    }
    setGoodSubmitted(true);
    setBadSubmitted(false);
    setShowFeedbackToast(true);
  };

  /**
   * 悪い評価を送信する
   */
  const handleBad = () => setFeedbackType("bad");

  return (
    <div
      className={`w-full flex mt-12 ${
        isUser ? "justify-end" : "justify-start flex-col"
      }`}
    >
      {isUser && !isEditing && (
        <div className="flex items-center mr-2 self-start">
          <ToolTipButton
            content="プロンプトをコピー"
            onClick={handleCopy}
            Icon={Copy}
          />
          {latest && (
            <ToolTipButton
              content="プロンプトを編集"
              onClick={handleEditPrompt}
              Icon={Pencil}
            />
          )}
        </div>
      )}
      <div
        className={`${
          isEditing ? "w-[80%]" : ""
        } rounded-xl px-3 py-2 text-sm ${
          isEditing ? "bg-white" : isUser ? "bg-blue-200" : ""
        }`}
      >
        {isEditing ? (
          <>
            <textarea
              ref={editRef}
              id="edit-text"
              className="w-full whitespace-pre-wrap p-3 break-words border rounded-xl text-sm text-gray-900 bg-white outline-none resize-none overflow-hidden border-blue-300"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
            />
            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                className="text-xs px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer"
                onClick={() => {
                  // 編集内容を破棄し、表示テキストを元の内容に戻す
                  setEditText(text);
                  setIsEditing(false);
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="text-xs px-3 py-1 border border-gray-300 text-white hover:bg-blue-400 bg-blue-600 rounded-full cursor-pointer"
                id="update-button"
                onClick={() => {
                  // 最新のユーザーメッセージのみ、編集内容で再送信（元のターンを削除）する
                  if (isUser && onEditAndResend) {
                    onEditAndResend(editText, historyId ?? "");
                  }
                  setIsEditing(false);
                }}
              >
                更新
              </button>
            </div>
          </>
        ) : (
          <div className="whitespace-pre-wrap break-words">{editText}</div>
        )}
        {createdAt && !isEditing && (
          <div className="text-[10px] opacity-70 mt-1">
            {new Date(createdAt).toLocaleString()}
          </div>
        )}
      </div>
      {!isUser && (
        <div className="flex flex-col ml-2 mt-2">
          <div className="mt-1 flex flex-wrap text-[11px] text-gray-500">
            <ToolTipButton
              content="良い回答"
              onClick={handleGood}
              Icon={ThumbsUp}
              active={goodSubmitted}
              variant="good"
            />
            <ToolTipButton
              content="悪い回答"
              onClick={handleBad}
              Icon={ThumbsDown}
              active={badSubmitted}
              variant="bad"
            />
            {latest && (
              <ToolTipButton
                content="やり直す"
                onClick={handleRedo}
                Icon={RotateCcw}
              />
            )}
            <ToolTipButton
              content="プロンプトをコピー"
              onClick={handleCopy}
              Icon={Copy}
            />
          </div>
        </div>
      )}
      {showFeedbackToast && !isUser && (
        <Toast message="ありがとうございました。お寄せいただいたフィードバックは、Myelin の改善に利用させていただきます。" />
      )}
      {showCopyToast && <Toast message="プロンプトをコピーしました。" />}
      {feedbackType && (
        <FeedbackModal
          feedbackType={feedbackType}
          goodReasons={goodReasons}
          badReasons={badReasons}
          selectedReasons={selectedReasons}
          feedbackComment={feedbackComment}
          onToggleReason={toggleReason}
          onChangeComment={setFeedbackComment}
          onClose={closeFeedback}
          onSubmit={submitFeedback}
        />
      )}
    </div>
  );
}
