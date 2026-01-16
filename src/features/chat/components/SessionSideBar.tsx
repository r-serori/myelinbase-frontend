import { Menu } from "lucide-react";

import ChatTooltip from "@/features/chat/components/ChatTooltip";
import SessionList from "@/features/chat/components/SessionList";
import { Button } from "@/components/ui/Button";

type SessionSideBarProps = {
  currentSessionId?: string;
  sidebarCollapsed: boolean;
  onToggleCollapsed: () => void;
  onNewChat: () => void;
};

export default function SessionSideBar({
  currentSessionId,
  sidebarCollapsed,
  onToggleCollapsed,
  onNewChat,
}: SessionSideBarProps) {
  return (
    <aside
      className={`
        h-full fixed top-12 bottom-0 left-0 z-50 bg-secondary transition-[width,height] duration-200 ${
          sidebarCollapsed ? "w-16" : "w-full md:w-56"
        }
      `}
    >
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-3 py-3 mt-2">
          <ChatTooltip
            content={sidebarCollapsed ? "メニューを開く" : "メニューを閉じる"}
            position="bottom-right"
          >
            <Button
              aria-label="チャットハンバーガー"
              variant="close"
              size="icon"
              onClick={onToggleCollapsed}
              className="hover:bg-muted/80"
            >
              <Menu className="size-5" />
            </Button>
          </ChatTooltip>
        </div>

        <SessionList
          currentSessionId={currentSessionId}
          sidebarCollapsed={sidebarCollapsed}
          onNewChat={onNewChat}
        />
      </div>
    </aside>
  );
}
