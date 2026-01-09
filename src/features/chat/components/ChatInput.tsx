"use client";

import { RefObject } from "react";
import router from "next/router";
import { Maximize, Mic, Minimize, SendHorizonal, Square } from "lucide-react";

import ChatTooltip from "@/features/chat/components/ChatTooltip";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  isDocumentPreviewOpen: boolean;
  input: string;
  onChangeInput: (value: string) => void;
  onSubmitByEnter: () => void | Promise<void>;
  onClickSendButton: () => void | Promise<void>;
  sidebarCollapsed: boolean;
  isExpanded: boolean;
  onToggleExpanded: (next: boolean) => void;
  isStreamingAnswer: boolean;
  isRecording: boolean;
  formRef: RefObject<HTMLFormElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

export default function ChatInput({
  isDocumentPreviewOpen,
  input,
  onChangeInput,
  onSubmitByEnter,
  onClickSendButton,
  sidebarCollapsed,
  isExpanded,
  onToggleExpanded,
  isStreamingAnswer,
  isRecording,
  formRef,
  inputRef,
}: ChatInputProps) {
  const inputLines = input.split("\n").length;

  return (
    <form
      id="chat-form"
      ref={formRef}
      className={`fixed bottom-0 left-0 right-0 z-20 ${
        sidebarCollapsed ? "ml-16" : "md:ml-56 ease-out"
      } transition-[margin] duration-200 ${
        isDocumentPreviewOpen ? "mr-[600px]" : ""
      }`}
    >
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(255,255,255,1) 50%, rgba(255,255,255,0.8) 70%, rgba(255,255,255,0) 100%)",
          height: "calc(100% + 40px)",
          bottom: "0",
          transform: "translateY(-40px)",
        }}
      />

      <div className="w-full flex items-center justify-center flex-col px-4 pb-6 pt-2">
        <div className="max-w-3xl flex w-full mx-auto bg-background border border-input rounded-[28px] p-2 shadow-sm transition-all duration-200">
          <div className="flex-1 flex items-center px-2 py-2 overflow-y-auto">
            <textarea
              id="input-textarea"
              ref={inputRef}
              className="flex-1 text-sm bg-transparent border-none focus:ring-0 outline-none resize-none text-foreground placeholder:text-muted-foreground leading-6 ml-2"
              placeholder="質問を入力してください"
              value={input}
              onChange={(e) => onChangeInput(e.target.value)}
              rows={1}
              style={{
                minHeight: "24px",
                maxHeight: isExpanded ? "60vh" : "200px",
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void onSubmitByEnter();
                }
              }}
            />
          </div>

          <div className="flex flex-col justify-between py-1 pr-1 gap-1">
            {inputLines >= 8 && !isExpanded && (
              <Button
                variant="close"
                size="icon"
                onClick={() => onToggleExpanded(true)}
              >
                <Maximize className="size-4" />
              </Button>
            )}
            {isExpanded && (
              <Button
                variant="close"
                size="icon"
                onClick={() => onToggleExpanded(false)}
              >
                <Minimize className="size-4" />
              </Button>
            )}

            <div className="flex items-end">
              <ChatTooltip
                content={
                  isStreamingAnswer
                    ? "生成を停止"
                    : input.trim().length > 0 && !isRecording
                      ? "送信"
                      : isRecording
                        ? "録音を停止"
                        : "音声入力"
                }
              >
                <button
                  id="chat-send-button"
                  type="button"
                  className={cn(
                    "rounded-full p-2.5 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-md",
                    isRecording
                      ? "bg-primary/10 text-primary hover:bg-primary/50 animate-pulse scale-120"
                      : "bg-muted/40 text-foreground hover:bg-muted/80"
                  )}
                  onClick={() => {
                    void onClickSendButton();
                  }}
                >
                  {isStreamingAnswer ? (
                    <Square className="size-4 fill-current" />
                  ) : input.trim().length > 0 && !isRecording ? (
                    <SendHorizonal className="size-5" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                </button>
              </ChatTooltip>
            </div>
          </div>
        </div>
        <Text variant="sm" color="muted" className="mt-3 select-none max-w-3xl">
          Myelin Baseのチャットはモデルのトレーニングには使用されません。 Myelin
          Baseは不正確な情報を表示することがあるため、回答を再確認してください。
          <Button
            variant="link"
            size="link"
            onClick={() => router.push("/privacy")}
            className="text-xs"
          >
            プライバシーについて
          </Button>
        </Text>
      </div>
    </form>
  );
}
