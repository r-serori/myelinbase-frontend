"use client";

import { Maximize, Mic, Minimize, SendHorizonal, Square } from "lucide-react";
import Tooltip from "../ui/Tooltip";
import Spinner from "../ui/Spinner";
import Link from "next/link";
import { RefObject } from "react";

type ChatInputProps = {
  input: string;
  onChangeInput: (value: string) => void;
  onSubmitByEnter: () => void | Promise<void>;
  onClickSendButton: () => void | Promise<void>;
  sidebarCollapsed: boolean;
  isExpanded: boolean;
  onToggleExpanded: (next: boolean) => void;
  isStreamingAnswer: boolean;
  isMutationPending: boolean;
  isRecording: boolean;
  formRef: RefObject<HTMLFormElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

export default function ChatInput({
  input,
  onChangeInput,
  onSubmitByEnter,
  onClickSendButton,
  sidebarCollapsed,
  isExpanded,
  onToggleExpanded,
  isStreamingAnswer,
  isMutationPending,
  isRecording,
  formRef,
  inputRef,
}: ChatInputProps) {
  const inputLines = input.split("\n").length;

  const bgClass = isExpanded
    ? "bg-gradient-to-t from-white/100 from-96% to-transparent"
    : inputLines >= 6
    ? "bg-gradient-to-t from-white/100 from-88% to-transparent"
    : inputLines >= 3
    ? "bg-gradient-to-t from-white/100 from-85% to-transparent"
    : "bg-gradient-to-t from-white/100 from-80% to-transparent";

  return (
    <form
      id="chat-form"
      ref={formRef}
      className={`fixed bottom-0 left-0 right-0 ${bgClass} px-4 py-5 pt-10 z-10 ${
        sidebarCollapsed ? "ml-16" : "md:ml-72 ease-out"
      } transition-[margin] duration-200`}
    >
      <div className="w-full flex items-center justify-center flex-col bg-white">
        <div className="max-w-3xl flex w-full mx-auto border border-gray-200 rounded-2xl p-1 shadow-md bg-white">
          <div className="flex-1 flex items-center px-4 py-3">
            <textarea
              id="input-textarea"
              ref={inputRef}
              className="flex-1 text-sm outline-none border-none bg-white focus:ring-0 outline-none resize-none overflow-hidden"
              placeholder="質問を入力してください（Shift+Enter で改行）"
              value={input}
              onChange={(e) => onChangeInput(e.target.value)}
              rows={1}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  // 日本語入力確定中の Enter を誤送信にしないため
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void onSubmitByEnter();
                }
              }}
            />
          </div>
          <div className="flex flex-col items-center py-2 mr-2 gap-1">
            {/* 8行以上になったら Maximize ボタンを表示 */}
            {inputLines >= 8 && !isExpanded && (
              <button
                type="button"
                className="rounded-full p-1 hover:bg-gray-200"
                onClick={() => onToggleExpanded(true)}
                aria-label="入力欄を拡大"
              >
                <Maximize className="w-5 h-5 text-gray-900" />
              </button>
            )}
            {isExpanded && (
              <button
                type="button"
                className="rounded-full p-1 hover:bg-gray-200"
                onClick={() => onToggleExpanded(false)}
                aria-label="入力欄を縮小"
              >
                <Minimize className="w-5 h-5 text-gray-900" />
              </button>
            )}
            <div className="flex-1 flex items-end justify-end">
              <Tooltip
                content={
                  isStreamingAnswer
                    ? "生成を停止"
                    : input.trim().length > 0
                    ? "送信"
                    : isRecording
                    ? "録音を停止"
                    : "音声モードを使用"
                }
              >
                <button
                  id="send-button"
                  type="button"
                  className={`rounded-full p-2 text-sm font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                    input.trim().length > 0
                      ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      : isRecording
                      ? "bg-blue-200 text-gray-900 hover:bg-blue-300"
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  }`}
                  aria-label={
                    isStreamingAnswer
                      ? "生成を停止"
                      : input.trim().length > 0
                      ? "送信"
                      : isRecording
                      ? "録音を停止"
                      : "音声モードを使用"
                  }
                  disabled={isMutationPending && !isStreamingAnswer}
                  onClick={() => {
                    void onClickSendButton();
                  }}
                >
                  {isStreamingAnswer ? (
                    <Square className="w-5 h-5 text-gray-900" />
                  ) : isMutationPending ? (
                    <Spinner />
                  ) : input.length > 0 ? (
                    <SendHorizonal className="w-5 h-5 text-gray-900" />
                  ) : (
                    <Mic className="w-5 h-5 text-gray-900" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 text-center mt-4">
          このチャットはモデルのトレーニングには使用されません。Myelin
          は不正確な情報を表示することがあるため、生成された回答を再確認するようにしてください。
          <Link href="/privacy" className="text-blue-500 hover:underline">
            プライバシーとMyelin
          </Link>
        </p>
      </div>
    </form>
  );
}


