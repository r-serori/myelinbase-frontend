"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * /chat/[sessionId] から /chat?sessionId=... へのリダイレクト専用クライアント
 * 実際のUIレイアウトは /chat/page.tsx 側に集約する。
 */
export default function ClientPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId;

  useEffect(() => {
    if (sessionId) {
      router.replace(`/chat?sessionId=${sessionId}`);
    } else {
      router.replace("/chat");
    }
  }, [router, sessionId]);

  // 軽いローディング（任意）
  return null;
}
