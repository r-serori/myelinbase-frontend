import { useRef, useEffect } from "react";

export function useChatScroll(
  dataPagesLength: number | undefined,
  sessionId: string | undefined,
  isStreamingAnswer: boolean,
  streamingAnswer: string | null,
  pendingUserMessage: string | null,
  fetchNextPage: () => Promise<any>,
  hasNextPage: boolean,
  isFetchingNextPage: boolean
) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const initialScrolledRef = useRef(false);
  const loadingMoreRef = useRef(false);

  // 初回ロード時スクロール
  useEffect(() => {
    if (!initialScrolledRef.current && (dataPagesLength ?? 0) > 0) {
      const container = scrollRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        initialScrolledRef.current = true;
      }
    }
  }, [dataPagesLength, sessionId]);

  // セッション変更時のリセット
  useEffect(() => {
    initialScrolledRef.current = false;
  }, [sessionId]);

  // 送信時のスクロール
  useEffect(() => {
    if (pendingUserMessage && scrollRef.current) {
      const scrollToBottom = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      };
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
    }
  }, [pendingUserMessage]);

  // 生成中の追従スクロール
  useEffect(() => {
    if (isStreamingAnswer && scrollRef.current) {
      const container = scrollRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        150;

      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [streamingAnswer, isStreamingAnswer]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || isFetchingNextPage || loadingMoreRef.current) return;

    const nearTop = el.scrollTop < 50;
    if (nearTop && hasNextPage) {
      loadingMoreRef.current = true;
      const prevHeight = el.scrollHeight;
      const prevTop = el.scrollTop;

      fetchNextPage().then(() => {
        requestAnimationFrame(() => {
          const newHeight = el.scrollHeight;
          const delta = newHeight - prevHeight;
          el.scrollTop = prevTop + delta;
          loadingMoreRef.current = false;
        });
      });
    }
  };

  return {
    scrollRef,
    onScroll,
  };
}

