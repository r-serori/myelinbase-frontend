import { useState, useEffect } from "react";
import {
  Copy,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import ChatToolTipButton from "../ChatToolTipButton";
import FeedbackToast from "../FeedbackToast";
import FeedbackModal from "../FeedbackModal";
import MarkdownViewer from "./MarkdownViewer";
import SourceDocumentList from "./SourceDocumentList";
import { SourceDocument } from "@/lib/schemas/chat";
import dayjs from "dayjs";

type AiMessageProps = {
  text: string;
  createdAt?: string;
  isLatest?: boolean;
  historyId?: string;
  isGenerating?: boolean;
  currentVersion?: number;
  totalVersions?: number;
  sourceDocuments?: SourceDocument[];
  onCopy?: (text: string) => void;
  onRedo?: () => void;
  onPrevVersion?: () => void;
  onNextVersion?: () => void;
  onSourceClick?: (doc: SourceDocument) => void;
  onGoodFeedback?: (historyId?: string) => void;
  onBadFeedback?: (
    historyId: string | undefined,
    reasons: string[],
    comment: string
  ) => void;
};

export default function AiMessage({
  text,
  createdAt,
  isLatest,
  historyId,
  isGenerating,
  currentVersion,
  totalVersions,
  sourceDocuments,
  onCopy,
  onRedo,
  onPrevVersion,
  onNextVersion,
  onSourceClick,
  onGoodFeedback,
  onBadFeedback,
}: AiMessageProps) {
  const [feedbackType, setFeedbackType] = useState<"good" | "bad" | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [goodSubmitted, setGoodSubmitted] = useState(false);
  const [badSubmitted, setBadSubmitted] = useState(false);
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);

  useEffect(() => {
    if (!showFeedbackToast) return;
    const timer = setTimeout(() => setShowFeedbackToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showFeedbackToast]);

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

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const closeFeedback = () => {
    setFeedbackType(null);
    setFeedbackComment("");
    setSelectedReasons([]);
  };

  const submitFeedback = () => {
    if (feedbackType === "bad" && onBadFeedback) {
      onBadFeedback(historyId, selectedReasons, feedbackComment);
      setBadSubmitted(true);
      setGoodSubmitted(false);
      setShowFeedbackToast(true);
    }
    closeFeedback();
  };

  const handleCopy = () => {
    if (onCopy) onCopy(text);
    setShowCopyToast(true);
  };

  const handleRedo = () => {
    if (onRedo) onRedo();
  };

  const handleGood = () => {
    if (onGoodFeedback && historyId) onGoodFeedback(historyId);
    setGoodSubmitted(true);
    setBadSubmitted(false);
    setShowFeedbackToast(true);
  };

  const handleBad = () => setFeedbackType("bad");

  return (
    <div className="w-full flex mt-8 justify-start flex-col">
      <div className="flex-shrink-0">
        <img
          src="/images/icon.png"
          alt="Myelin Base Logo"
          width={32}
          height={32}
          className={`object-contain ${isGenerating ? "animate-bounce" : ""}`}
        />
      </div>

      <div className="w-full flex flex-col items-start max-w-full min-w-0">
        <div className="flex flex-col w-full">
          <div className="rounded-xl px-4 py-3 text-sm max-w-full">
            {isGenerating ? (
              <Text
                variant="md"
                color="muted"
                className="animate-pulse"
                as="span"
              >
                Myelin Baseが応答を生成しています...
              </Text>
            ) : (
              <MarkdownViewer content={text} />
            )}

            {createdAt && !isGenerating && (
              <div className="mt-1 text-right">
                <Text variant="xs" color="muted" as="span">
                  {dayjs(createdAt).format("YYYY/MM/DD HH:mm")}
                </Text>
              </div>
            )}
          </div>
        </div>

        {!isGenerating && sourceDocuments && sourceDocuments.length > 0 && (
          <SourceDocumentList
            documents={sourceDocuments}
            onSourceClick={onSourceClick}
          />
        )}

        {!isGenerating && (
          <div className="flex items-center justify-between mt-3 ml-1 w-full max-w-full">
            <div className="flex flex-wrap gap-1">
              <ChatToolTipButton
                content="良い回答"
                onClick={handleGood}
                Icon={ThumbsUp}
                active={goodSubmitted}
                variant="good"
              />
              <ChatToolTipButton
                content="悪い回答"
                onClick={handleBad}
                Icon={ThumbsDown}
                active={badSubmitted}
                variant="bad"
              />
              {isLatest && (
                <ChatToolTipButton
                  content="やり直す"
                  onClick={handleRedo}
                  Icon={RotateCcw}
                />
              )}
              <ChatToolTipButton
                content="プロンプトをコピー"
                onClick={handleCopy}
                Icon={Copy}
              />
            </div>

            {totalVersions && totalVersions > 1 && (
              <div className="flex items-center gap-1 select-none ml-2">
                <Button
                  size="icon"
                  variant="close"
                  onClick={onPrevVersion}
                  disabled={(currentVersion || 1) <= 1}
                  aria-label="前の回答へ"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Text variant="sm" as="span" className="mx-1">
                  {currentVersion} / {totalVersions}
                </Text>
                <Button
                  size="icon"
                  variant="close"
                  onClick={onNextVersion}
                  disabled={(currentVersion || 1) >= totalVersions}
                  aria-label="次の回答へ"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {showFeedbackToast && (
        <FeedbackToast message="ありがとうございました。お寄せいただいたフィードバックは、Myelin Base の改善に利用させていただきます。" />
      )}
      {showCopyToast && <FeedbackToast message="回答をコピーしました。" />}

      <FeedbackModal
        isOpen={feedbackType !== null}
        feedbackType={feedbackType ?? "good"}
        goodReasons={goodReasons}
        badReasons={badReasons}
        selectedReasons={selectedReasons}
        feedbackComment={feedbackComment}
        onToggleReason={toggleReason}
        onChangeComment={setFeedbackComment}
        onClose={closeFeedback}
        onSubmit={submitFeedback}
      />
    </div>
  );
}
