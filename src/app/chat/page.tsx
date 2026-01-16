"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import RequireAuth from "@/features/auth/components/RequireAuth";
import ChatContent from "@/features/chat/components/ChatContent";
import DocumentPreviewSidebar from "@/features/chat/components/DocumentPreviewSidebar";
import SessionSideBar from "@/features/chat/components/SessionSideBar";
import { useChatStore } from "@/features/chat/hooks/useChatStore";
import { SourceDocument } from "@/lib/api/generated/model";

export default function ChatPage() {
  return (
    <RequireAuth>
      <Main />
    </RequireAuth>
  );
}

function Main() {
  const router = useRouter();
  const search = useSearchParams();
  const urlSessionId = search.get("sessionId") || undefined;

  // StoreからローカルのセッションIDを取得
  const { localSessionId, setLocalSessionId } = useChatStore();

  // 【重要】優先順位: URL(urlSessionId) > Store(localSessionId)
  // 1. SessionListからの遷移時: URLパラメータが変わるので、即座に新しいIDが反映されます。
  // 2. 新規作成後のreplaceState時: URLパラメータは検知されない(undefined)ため、StoreのIDが使われます。
  const currentSessionId = urlSessionId ?? localSessionId;

  // URLが変わった場合（ブラウザの戻る/進む、SessionListクリック時）
  // StoreをURLの値に同期させて、整合性を保ちます
  useEffect(() => {
    if (urlSessionId && urlSessionId !== localSessionId) {
      setLocalSessionId(urlSessionId);
    }
  }, [urlSessionId, setLocalSessionId, localSessionId]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [activeDocument, setActiveDocument] = useState<SourceDocument | null>(
    null
  );

  return (
    <div className="flex relative h-full overflow-hidden">
      <SessionSideBar
        currentSessionId={currentSessionId}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        onNewChat={() => {
          // 新規チャット時はStoreをリセットしてから遷移
          setLocalSessionId(undefined);
          router.push("/chat");
        }}
      />

      <section
        className={`flex-1 flex flex-col h-full overflow-hidden ease-out transition-[margin] duration-200 ${
          sidebarCollapsed ? "ml-16" : "md:ml-56"
        } ${activeDocument ? "mr-0 md:mr-[600px]" : ""}`}
      >
        <ChatContent
          sessionId={urlSessionId} // ChatContent内でも localSessionId とのマージが行われます
          isDocumentPreviewOpen={!!activeDocument}
          sidebarCollapsed={sidebarCollapsed}
          onSourceClick={(doc) => setActiveDocument(doc)}
        />
      </section>

      <aside
        className={`fixed top-12 right-0 bottom-0 w-full rounded-xs lg:w-[600px] bg-secondary border border-primary/20 z-60 transform transition-transform duration-300 ease-in-out ${
          activeDocument ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <DocumentPreviewSidebar
          document={activeDocument}
          isOpen={!!activeDocument}
          onClose={() => setActiveDocument(null)}
        />
      </aside>
    </div>
  );
}
