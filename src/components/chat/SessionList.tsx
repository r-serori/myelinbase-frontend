"use client";
import Link from "next/link";
import { useSessions } from "@/hooks/useSessions";
import { Edit } from "lucide-react";
import dayjs from "dayjs";

type SessionListProps = {
  currentSessionId?: string;
  sidebarCollapsed: boolean;
  onNewChat: () => void;
};

export default function SessionList({
  currentSessionId,
  sidebarCollapsed,
  onNewChat,
}: SessionListProps) {
  const { data, isLoading } = useSessions();
  const sessions = data?.sessions ?? [];

  return (
    <div className={`transition-[max-height,opacity] duration-200 ease-out`}>
      {isLoading ? (
        <div className="text-sm text-gray-500 p-3">Loading...</div>
      ) : (
        <div className={`h-full overflow-y-auto`}>
          <div className="overflow-hidden px-2">
            <button
              id="new-chat-button"
              type="button"
              onClick={onNewChat}
              className="relative w-full flex items-center rounded-full text-sm text-gray-900 hover:bg-gray-300 cursor-pointer gap-2 p-3 my-4"
            >
              <Edit className="w-5 h-5 ml-0.5" />
              {!sidebarCollapsed && (
                <span className="absolute left-10 ml-2 text-ellipsis overflow-hidden whitespace-nowrap">
                  チャットを新規作成
                </span>
              )}
            </button>
          </div>
          {!sidebarCollapsed && (
            <ul className={`space-y-1 px-2 py-2`}>
              {sessions.map((s) => {
                const active = s.sessionId === currentSessionId;
                return (
                  <li key={s.sessionId}>
                    <Link
                      id={`session-link-${s.sessionId}`}
                      href={`/chat?sessionId=${s.sessionId}`}
                      className={`block text-sm rounded-full px-4 py-2  ${
                        active
                          ? "bg-blue-200 cursor-default"
                          : "hover:bg-gray-300"
                      }`}
                      title={s.sessionName}
                    >
                      <div className="text-ellipsis overflow-hidden whitespace-nowrap">
                        {s.sessionName}
                      </div>
                      <div className="text-xs text-gray-500 text-ellipsis overflow-hidden whitespace-nowrap">
                        更新:{" "}
                        {dayjs(s.lastMessageAt).format("YYYY/MM/DD HH:mm")}
                      </div>
                    </Link>
                  </li>
                );
              })}
              {sessions.length === 0 && (
                <li className="text-sm text-gray-500 px-3 py-2">
                  チャットを新規作成してみましょう！
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
