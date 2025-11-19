import { HamburgerIcon } from "lucide-react";
import SessionList from "./SessionList";

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
        h-screen fixed top-12 bottom-0 left-0 z-50 bg-gray-100 shadow-lg md:shadow-none transition-[width,height] duration-200 ${
          sidebarCollapsed ? "w-16" : "w-full md:w-72"
        }
      `}
    >
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 mt-2">
          <button
            id="toggle-sidebar-button"
            type="button"
            onClick={onToggleCollapsed}
            className={`w-8 h-8 inline-flex items-center justify-center rounded-md border text-gray-600 hover:bg-gray-300 cursor-pointer ml-1`}
            aria-label={
              sidebarCollapsed
                ? "セッション一覧を展開"
                : "セッション一覧を折りたたむ"
            }
          >
            <HamburgerIcon className="w-5 h-5" />
          </button>
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
