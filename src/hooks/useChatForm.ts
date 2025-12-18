import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { ChatStreamRequestSchema } from "@/lib/schemas/chat";
import { getErrorMessage } from "@/lib/error-mapping";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type GenerateFn = (
  payload: any,
  options?: { onDone?: () => void }
) => Promise<void>;

type StopFn = () => void;

export function useChatForm(
  sessionId: string | undefined,
  generate: GenerateFn,
  stop: StopFn,
  isStreamingAnswer: boolean,
  onGenerateDone?: () => void
) {
  const router = useRouter();
  const { showToast } = useToast();

  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [formHeight, setFormHeight] = useState<number>(120);

  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // 音声入力
  const {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    isSupported: isSpeechSupported,
  } = useSpeechRecognition();
  const [baseInput, setBaseInput] = useState("");

  // リセット処理
  const resetForm = useCallback(() => {
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  }, []);

  // 送信処理
  const doSend = async (
    overrideQuery?: string,
    options?: { redoHistoryId?: string }
  ) => {
    if (isStreamingAnswer) {
      stop();
    }

    const base = overrideQuery ?? input;
    const q = base.trim();

    let targetSessionId = sessionId;
    if (!targetSessionId) {
      targetSessionId = crypto.randomUUID();
      router.replace(`/chat?sessionId=${targetSessionId}`);
    }

    const result = ChatStreamRequestSchema.safeParse({
      query: q,
      sessionId: targetSessionId,
      redoHistoryId: options?.redoHistoryId,
    });

    if (!result.success) {
      const isEmpty = result.error.issues.some(
        (i) => i.path[0] === "query" && i.code === "too_small"
      );
      if (isEmpty && q.length === 0) {
        return;
      }
      showToast({ type: "error", message: "入力内容が正しくありません。" });
      return;
    }

    const isRedo = !!options?.redoHistoryId;

    if (!isRedo) {
      if (!overrideQuery) {
        resetForm();
      }
    }

    try {
      await generate(
        {
          query: q,
          sessionId: targetSessionId,
          redoHistoryId: options?.redoHistoryId,
        },
        {
          onDone: onGenerateDone,
        }
      );
    } catch (err: any) {
      showToast({ type: "error", message: getErrorMessage(err) });
      throw err; // エラーを伝播させる（呼び出し元でcatchできるように）
    }
  };

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      if (!isSpeechSupported) {
        showToast({
          type: "error",
          message: "このブラウザは音声入力をサポートしていません。",
        });
        return;
      }
      setBaseInput(input);
      startRecording();
    }
  }, [
    isRecording,
    stopRecording,
    isSpeechSupported,
    showToast,
    input,
    startRecording,
  ]);

  useEffect(() => {
    if (isRecording) {
      setInput(baseInput + transcript);
    }
  }, [transcript, isRecording, baseInput]);

  // 高さ調整
  const updateFormHeight = useCallback(() => {
    if (formRef.current) {
      setFormHeight(formRef.current.getBoundingClientRect().height);
    }
  }, []);

  useEffect(() => {
    updateFormHeight();
    window.addEventListener("resize", updateFormHeight);
    return () => window.removeEventListener("resize", updateFormHeight);
  }, [updateFormHeight]);

  useEffect(() => {
    updateFormHeight();
  }, [input, isExpanded, updateFormHeight]);

  useEffect(() => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    el.style.height = "auto";
    if (isExpanded) {
      const expandedHeight = (window.innerHeight * 2) / 3;
      const newHeight = Math.max(el.scrollHeight, expandedHeight);
      el.style.height = `${newHeight}px`;
    } else {
      const maxHeight = 200;
      const newHeight = Math.min(el.scrollHeight, maxHeight);
      el.style.height = `${newHeight}px`;
    }
  }, [input, isExpanded]);

  return {
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
  };
}
