"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import RequireAuth from "@/features/auth/components/RequireAuth";
import ChatContent from "@/features/chat/components/ChatContent";
import DocumentPreviewSidebar from "@/features/chat/components/DocumentPreviewSidebar";
import SessionSideBar from "@/features/chat/components/SessionSideBar";
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

  const currentSessionId = search.get("sessionId") || undefined;

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
          router.replace("/chat");
        }}
      />

      <section
        className={`flex-1 flex flex-col h-full overflow-hidden ease-out transition-[margin] duration-200 ${
          sidebarCollapsed ? "ml-16" : "md:ml-56"
        } ${activeDocument ? "mr-0 md:mr-[600px]" : ""}`}
      >
        <ChatContent
          sessionId={currentSessionId}
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
