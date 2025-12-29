"use client";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSpeechRecognition } from "@/features/chat/hooks/useSpeechRecognition";
import { handleCommonError } from "@/lib/error-handler";

import { useToast } from "@/providers/ToastProvider";

type SendHandler = (
  overrideQuery?: string,
  options?: { redoHistoryId?: string }
) => Promise<void>;

/**
 * useChatForm
 *
 * - input, setInput は呼び出し元（ChatWindow）で useState で管理
 * - onSubmit は sendMessage を呼び出すラッパー関数を受け取る
 * - sendMessage({ text }, { body }) の形式で呼び出す
 * - onNewSessionCreated: 新規セッション作成時にセッションIDを通知するコールバック
 *   （URLの更新はストリーミング完了後に行うため、ここでは行わない）
 */
export function useChatForm(
  sessionId: string | undefined,
  input: string,
  setInput: (value: string) => void,
  onSubmit: (options: {
    body: { sessionId: string; redoHistoryId?: string };
    query: string;
  }) => Promise<void>,
  isStreamingAnswer: boolean,
  stop: () => void,
  onNewSessionCreated?: (newSessionId: string) => void
) {
  const { showToast } = useToast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [formHeight, setFormHeight] = useState<number>(120);

  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const handleTranscript = useCallback(
    (text: string) => {
      setInput(text);
    },
    [setInput]
  );

  // 音声入力
  const {
    isRecording,
    startRecording,
    stopRecording,
    isSupported: isSpeechSupported,
  } = useSpeechRecognition({
    onTranscript: handleTranscript,
  });

  // リセット処理
  const resetForm = useCallback(() => {
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  }, [setInput]);

  // 送信処理
  const doSend: SendHandler = async (overrideQuery, options) => {
    if (isStreamingAnswer) {
      stop();
    }

    const base = overrideQuery ?? input;
    const q = base.trim();

    if (!q) {
      showToast({
        type: "error",
        message: "メッセージを入力してください。",
      });
      return;
    }

    // セッションIDがない場合は新規作成
    // URLの更新はストリーミング完了後に行うため、ここではコールバックで通知のみ
    let targetSessionId = sessionId;
    if (!targetSessionId) {
      targetSessionId = crypto.randomUUID();
      onNewSessionCreated?.(targetSessionId);
    }

    const isRedo = !!options?.redoHistoryId;

    if (!isRedo && !overrideQuery) {
      resetForm();
    }

    try {
      await onSubmit({
        body: {
          sessionId: targetSessionId,
          redoHistoryId: options?.redoHistoryId,
        },
        query: q,
      });
    } catch (err: unknown) {
      handleCommonError(
        err,
        (message) => {
          showToast({
            type: "error",
            message,
          });
        },
        showToast,
        "チャットの送信に失敗しました。"
      );
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
      startRecording();
    }
  }, [
    isRecording,
    stopRecording,
    isSpeechSupported,
    showToast,
    startRecording,
  ]);

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
