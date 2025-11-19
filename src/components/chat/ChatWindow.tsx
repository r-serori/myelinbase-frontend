"use client";
import { useSessionMessages } from "@/hooks/useSessionMessages";
import { useChatSearch } from "@/hooks/useChatSearch";
import { useChatFeedback } from "@/hooks/useChatFeedback";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import ChatInput from "./ChatInput";
import ChatMessagesPane from "./ChatMessagesPane";
import { getJwt } from "@/lib/auth";

export default function ChatWindow({
  sessionId,
  sidebarCollapsed,
}: {
  sessionId?: string;
  sidebarCollapsed: boolean;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSessionMessages(sessionId);
  const feedbackMutation = useChatFeedback();
  const mutation = useChatSearch();

  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(
    null
  );
  const [pendingCreatedAt, setPendingCreatedAt] = useState<string | null>(null);
  const [redoingHistoryId, setRedoingHistoryId] = useState<string | null>(null);
  const [streamingAnswer, setStreamingAnswer] = useState<string | null>(null);
  const [isStreamingAnswer, setIsStreamingAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const cancelStreamRef = useRef(false);
  const currentAbortControllerRef = useRef<AbortController | null>(null);
  const initialScrolledRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const latestUserMessageRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [formHeight, setFormHeight] = useState<number>(120);
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  const useStreamApi =
    process.env.NEXT_PUBLIC_CHAT_USE_STREAM === "true" && !useMocks;

  // サーバは order=desc（最新→過去）で返却。UIでは最新を下にしたいのでreverse。
  // TODO: サーバーを修正して、order=asc（過去→最新）で返却するようにする。
  const messages = useMemo(
    () =>
      (data?.pages ?? [])
        .flatMap((p) => p.items)
        .slice()
        .reverse(),
    [data?.pages]
  );

  // セッションが切り替わったら、次のロードで再度「直近のユーザー質問までスクロール」する
  useEffect(() => {
    initialScrolledRef.current = false;
  }, [sessionId]);

  // 初回ロード時は常に「直近の最新ユーザー質問」までスクロール
  useEffect(() => {
    if (!initialScrolledRef.current && (data?.pages?.length ?? 0) > 0) {
      const container = scrollRef.current;
      const target = latestUserMessageRef.current;
      if (container && target) {
        const offsetTop = target.offsetTop;
        container.scrollTop = offsetTop - 16; // 少し余白を残してスクロール
        initialScrolledRef.current = true;
      }
    }
  }, [data?.pages?.length, sessionId]);

  useEffect(() => {
    updateFormHeight();
    window.addEventListener("resize", updateFormHeight);
    return () => {
      window.removeEventListener("resize", updateFormHeight);
    };
  }, []);

  // 入力状態や拡大状態が変わったときも高さを取り直す
  useEffect(() => {
    updateFormHeight();
  }, [input, isExpanded]);

  useEffect(() => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    el.style.height = "auto";

    if (isExpanded) {
      // 拡大時: コンテンツ量に関わらず、最低でもある程度の高さを確保する
      const expandedHeight = (window.innerHeight * 2) / 3; // px: screenの高さの2/3
      const newHeight = Math.max(el.scrollHeight, expandedHeight);
      el.style.height = `${newHeight}px`;
    } else {
      // 通常時: コンテンツ量に応じて自動伸長（上限あり）
      const maxHeight = 200; // px: 適宜調整
      const newHeight = Math.min(el.scrollHeight, maxHeight);
      el.style.height = `${newHeight}px`;
    }
  }, [input, isExpanded]);

  /**
   * スクロールイベントハンドラー
   */
  function onScroll() {
    const el = scrollRef.current;
    if (!el || isFetchingNextPage || loadingMoreRef.current) return;
    const nearTop = el.scrollTop < 80;
    if (nearTop && hasNextPage) {
      loadingMoreRef.current = true;
      const prevHeight = el.scrollHeight;
      const prevTop = el.scrollTop;
      fetchNextPage().finally(() => {
        // 高さ差分分だけスクロール位置を補正（視点を維持）
        requestAnimationFrame(() => {
          const newHeight = el.scrollHeight;
          const delta = newHeight - prevHeight;
          el.scrollTop = prevTop + delta;
          loadingMoreRef.current = false;
        });
      });
    }
  }

  /**
   * 回答を描画
   * @param full 回答の全文
   * @param chunksFromServer サーバーがチャンクを返している場合はそれを優先的に使用
   */
  async function streamAnswer(full: string, chunksFromServer?: string[]) {
    // Gemini / ChatGPT 風に、一定間隔でテキストを少しずつ追加していく
    setIsStreamingAnswer(true);
    setStreamingAnswer("");
    cancelStreamRef.current = false;

    // サーバーから渡されたチャンクをそのまま使用
    const chunks: string[] =
      chunksFromServer && chunksFromServer.length > 0
        ? chunksFromServer
        : [full];

    let current = "";
    for (const chunk of chunks) {
      if (cancelStreamRef.current) break;
      current += chunk;
      setStreamingAnswer(current);
      // 実際にはサーバ側のチャンクに合わせるが、ここではクライアント側で擬似的にインターバルを付ける
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 60));
    }

    setIsStreamingAnswer(false);
  }

  /**
   * ユーザー質問を送信
   * @param overrideQuery 上書きする質問（通常はinput）
   * @param options オプション
   */
  async function doSend(
    overrideQuery?: string,
    options?: { redoHistoryId?: string }
  ) {
    const base = overrideQuery ?? input;
    const q = base.trim();
    if (!q) return;

    const isRedo = !!options?.redoHistoryId;

    // 通常送信 or redo/edit の場合に pending 表示を出す
    if (isRedo || !overrideQuery) {
      setPendingUserMessage(q);
      setPendingCreatedAt(new Date().toISOString());
      if (!overrideQuery) {
        setInput("");
        if (inputRef.current) {
          inputRef.current.style.height = "auto";
        }
      }
    }
    if (isRedo && options?.redoHistoryId) {
      setRedoingHistoryId(options.redoHistoryId);
    }

    // 既存のリクエストがあればキャンセル
    if (currentAbortControllerRef.current) {
      currentAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    currentAbortControllerRef.current = abortController;

    try {
      const result = useStreamApi
        ? await sendWithStream(q, options, abortController.signal)
        : await sendWithMutation(q, options, abortController.signal);

      if (!sessionId && result?.sessionId) {
        // 新規チャット: 付与されたsessionIdでURLとセッション一覧を更新
        router.replace(`/chat?sessionId=${result.sessionId}`);
        await qc.invalidateQueries({ queryKey: queryKeys.sessions });
      } else if (sessionId) {
        // 既存セッション: メッセージ一覧を更新（ストリーミング終了後に履歴も更新）
        await qc.invalidateQueries({
          queryKey: queryKeys.sessionMessages(sessionId),
        });
      }
      // 送信後は最新（下端）へ
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    } catch (err: any) {
      // AbortController によるキャンセルはエラーとして扱わない
      if (err?.name === "AbortError") {
        console.warn("検索リクエストがキャンセルされました");
      } else {
        console.error("検索リクエスト中にエラーが発生しました:", err);
      }
    } finally {
      currentAbortControllerRef.current = null;
      setPendingUserMessage(null);
      setPendingCreatedAt(null);
      setRedoingHistoryId(null);
      setStreamingAnswer(null);
      setIsStreamingAnswer(false);
    }
  }

  async function sendWithMutation(
    q: string,
    options: { redoHistoryId?: string } | undefined,
    signal: AbortSignal
  ) {
    const res = (await mutation.mutateAsync({
      query: q,
      sessionId,
      redoHistoryId: options?.redoHistoryId,
      signal,
    })) as any;
    const answer: string | undefined = res?.answer;
    const answerChunks: string[] | undefined = res?.answerChunks;

    // 回答をストリーミング風に描画
    if (answer) {
      await streamAnswer(answer, answerChunks);
    }

    return { sessionId: res?.sessionId as string | undefined };
  }

  async function sendWithStream(
    q: string,
    options: { redoHistoryId?: string } | undefined,
    signal: AbortSignal
  ) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      throw new Error("API base URL is not configured.");
    }

    const token = await getJwt();
    cancelStreamRef.current = false;
    setStreamingAnswer("");
    setIsStreamingAnswer(true);

    const response = await fetch(`${baseUrl}/chat/search/stream`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: q,
        sessionId,
        redoHistoryId: options?.redoHistoryId,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Stream API Error ${response.status}`);
    }
    if (!response.body) {
      throw new Error("Streaming response body is empty.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let nextSessionId: string | undefined = sessionId;

    try {
      while (true) {
        if (cancelStreamRef.current) {
          await reader.cancel();
          break;
        }
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary: number;
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const dataLine = rawEvent
            .split("\n")
            .find((line) => line.startsWith("data:"));
          if (!dataLine) continue;
          const payloadText = dataLine.slice(5).trim();
          if (!payloadText) continue;
          const payload = JSON.parse(payloadText);
          if (payload.error) {
            throw new Error(payload.message ?? "Stream failed.");
          }
          if (payload.chunk) {
            setStreamingAnswer((prev) => (prev ?? "") + payload.chunk);
          }
          if (payload.sessionId) {
            nextSessionId = payload.sessionId;
          }
          if (payload.done) {
            nextSessionId = payload.sessionId ?? nextSessionId;
            return { sessionId: nextSessionId };
          }
        }
      }
      return { sessionId: nextSessionId };
    } finally {
      reader.releaseLock();
    }
  }

  // フォームの実際の高さを計測して、メッセージ領域の高さ計算に使う
  function updateFormHeight() {
    if (!formRef.current) return;
    const rect = formRef.current.getBoundingClientRect();
    setFormHeight(rect.height);
  }

  async function toggleRecording() {
    if (isRecording) {
      // 録音停止
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      setIsRecording(false);
      return;
    }
    // 録音開始
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.warn("getUserMedia is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsRecording(true);
      // TODO: MediaRecorder や SpeechRecognition を用いて音声→テキスト変換を実装
    } catch (err) {
      console.error("マイクの取得に失敗しました:", err);
    }
  }

  return (
    <div
      className="w-full flex flex-col relative"
      style={{ height: `calc(100vh - ${formHeight}px)` }}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto h-full"
        onScroll={onScroll}
      >
        <ChatMessagesPane
          messages={messages}
          isLoading={isLoading}
          pendingUserMessage={pendingUserMessage}
          pendingCreatedAt={pendingCreatedAt}
          redoingHistoryId={redoingHistoryId}
          streamingAnswer={streamingAnswer}
          latestUserMessageRef={latestUserMessageRef}
          onDoSend={doSend}
          feedbackMutation={feedbackMutation}
        />
      </div>
      <ChatInput
        input={input}
        onChangeInput={setInput}
        onSubmitByEnter={async () => {
          await doSend();
        }}
        onClickSendButton={async () => {
          if (isStreamingAnswer) {
            // ストリーミング中は「停止」ボタンとして動作
            cancelStreamRef.current = true;
            if (currentAbortControllerRef.current) {
              currentAbortControllerRef.current.abort();
            }
            setIsStreamingAnswer(false);
            return;
          }
          if (input.trim().length > 0) {
            await doSend();
          } else {
            await toggleRecording();
          }
        }}
        sidebarCollapsed={sidebarCollapsed}
        isExpanded={isExpanded}
        onToggleExpanded={setIsExpanded}
        isStreamingAnswer={isStreamingAnswer}
        isMutationPending={mutation.isPending}
        isRecording={isRecording}
        formRef={formRef}
        inputRef={inputRef}
      />
    </div>
  );
}
