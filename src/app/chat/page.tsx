"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import ChatWindow from "@/components/chat/ChatWindow";
import { useSessions } from "@/hooks/useSessions";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SessionSideBar from "@/components/chat/SessionSideBar";

export default function ChatPage() {
  return (
    <RequireAuth>
      <Main />
    </RequireAuth>
  );
}

function Main() {
  const { data, isLoading } = useSessions();
  const router = useRouter();
  const search = useSearchParams();
  const currentSessionId = search.get("sessionId") || undefined;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isNewSession, setIsNewSession] = useState(false);

  useEffect(() => {
    const first = data?.sessions?.[0];
    if (!isLoading && first && !currentSessionId && !isNewSession) {
      router.replace(`/chat?sessionId=${first.sessionId}`);
    }
  }, [data, isLoading, router, currentSessionId, isNewSession]);

  return (
    <div className="flex h-[calc(100vh-48px)] relative">
      <SessionSideBar
        currentSessionId={currentSessionId}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        onNewChat={() => {
          setIsNewSession(true);
          router.replace("/chat");
        }}
      />

      <section
        className={`h-full flex-1 flex flex-col ease-out transition-[margin] duration-200 ${
          sidebarCollapsed ? "ml-16" : "md:ml-72"
        }`}
      >
        {currentSessionId || isNewSession ? (
          <ChatWindow
            sessionId={currentSessionId}
            sidebarCollapsed={sidebarCollapsed}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            チャットを新規作成してください
          </div>
        )}
      </section>
    </div>
  );
}
