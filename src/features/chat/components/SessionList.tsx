"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Edit, MoreVertical, Trash } from "lucide-react";

import ChatTooltip from "@/features/chat/components/ChatTooltip";
import {
  useDeleteSession,
  useSessions,
  useUpdateSessionName,
} from "@/features/chat/hooks/useSessions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { Text } from "@/components/ui/Text";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { handleCommonError } from "@/lib/error-handler";

import { useToast } from "@/providers/ToastProvider";

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
  const router = useRouter();
  const { showToast } = useToast();
  const { data, isLoading, isError, error } = useSessions();
  useQueryErrorToast(isError, error);

  const updateSessionName = useUpdateSessionName();
  const deleteSession = useDeleteSession();
  const sessions = data?.sessions ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEditStart = (sessionId: string, currentName: string) => {
    setEditingId(sessionId);
    setEditName(currentName);
    setMenuOpenId(null);
  };

  const handleEditSave = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      const response = await updateSessionName.mutateAsync({
        sessionId: editingId,
        sessionName: editName.trim(),
      });
      if (response.status === "success") {
        showToast({ type: "success", message: "チャット名を更新しました" });
      }
    } catch (err: unknown) {
      handleCommonError(
        err,
        setErrorMessage,
        showToast,
        "チャット名の更新に失敗しました"
      );
    }
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleteSessionId) return;

    try {
      await deleteSession.mutateAsync(deleteSessionId);
      if (currentSessionId === deleteSessionId) {
        router.replace("/chat");
      }
      showToast({ type: "success", message: "チャットを削除しました" });
    } catch (err: unknown) {
      handleCommonError(
        err,
        setErrorMessage,
        showToast,
        "チャットの削除に失敗しました"
      );
    }

    setMenuOpenId(null);
    setDeleteModalOpen(false);
    setDeleteSessionId(null);
  };

  return (
    <div className="transition-[max-height,opacity] duration-200 ease-out h-full flex flex-col overflow-hidden">
      {isLoading ? (
        <div className="flex items-left justify-center h-full">
          <Spinner size="5" color="foreground" />
        </div>
      ) : (
        <div className="h-full flex flex-col min-h-0">
          <div className="px-2 flex-shrink-0">
            <ChatTooltip
              content="チャットを新規作成"
              position={sidebarCollapsed ? "bottom-right" : "bottom"}
            >
              <Button
                variant="ghost"
                onClick={onNewChat}
                className="w-full flex items-center justify-start gap-2 p-3 my-4 rounded-full text-gray-900 hover:bg-gray-300 h-auto text-sm font-normal shadow-none"
              >
                <Edit className="size-5" />
                {!sidebarCollapsed && (
                  <Text
                    variant="sm"
                    className="absolute left-10 text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    チャットを新規作成
                  </Text>
                )}
              </Button>
            </ChatTooltip>
          </div>
          {!sidebarCollapsed && (
            <ul className={`space-y-1 px-2 py-2 flex-1 overflow-y-auto`}>
              {sessions.map((s, index) => {
                const active = s.sessionId === currentSessionId;
                const isEditing = editingId === s.sessionId;

                return (
                  <li key={s.sessionId} className="relative group">
                    <div className="relative">
                      <Link
                        id={`session-link-${s.sessionId}`}
                        href={`/chat?sessionId=${s.sessionId}`}
                        className={`block rounded-full px-4 py-3 ${
                          active
                            ? "bg-primary/20 cursor-default"
                            : "hover:bg-primary/20"
                        }`}
                        title={s.sessionName}
                      >
                        <div className="flex flex-col gap-1">
                          <Text
                            variant="md"
                            className="text-ellipsis overflow-hidden whitespace-nowrap"
                            as="span"
                          >
                            {s.sessionName}
                          </Text>
                          <Text
                            variant="xs"
                            color="muted"
                            className="text-ellipsis overflow-hidden whitespace-nowrap"
                            as="span"
                          >
                            更新：{" "}
                            {dayjs(s.lastMessageAt).format("YYYY/MM/DD HH:mm")}
                          </Text>
                        </div>
                      </Link>
                      <Button
                        variant="close"
                        size="icon"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                          menuOpenId === s.sessionId &&
                          "opacity-100 text-primary"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpenId(
                            menuOpenId === s.sessionId ? null : s.sessionId
                          );
                        }}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                      {menuOpenId === s.sessionId && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-8 w-32 bg-background border rounded shadow-lg z-10 overflow-hidden"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left flex items-center gap-2"
                            onClick={(e) => {
                              e.preventDefault();
                              handleEditStart(s.sessionId, s.sessionName);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                            名前を変更
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left flex items-center gap-2 text-destructive hover:text-destructive/80"
                            onClick={(e) => {
                              e.preventDefault();
                              setDeleteModalOpen(true);
                              setDeleteSessionId(s.sessionId);
                            }}
                          >
                            <Trash className="w-3 h-3" />
                            削除
                          </Button>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <Modal
                        isOpen={isEditing}
                        title="チャット名を変更"
                        onClose={() => setEditingId(null)}
                        size="md"
                      >
                        <div className="flex flex-col gap-4">
                          <Input
                            size="full"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-4 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingId(null)}
                            >
                              キャンセル
                            </Button>
                            <Button size="sm" onClick={handleEditSave}>
                              保存
                            </Button>
                          </div>
                        </div>
                      </Modal>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        title="チャットを削除"
        onClose={() => setDeleteModalOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <Text variant="md" leading="relaxed">
            このチャット履歴を削除しますか？
          </Text>
          {errorMessage && (
            <Text variant="sm" color="destructive" leading="relaxed">
              {errorMessage}
            </Text>
          )}
          <div className="flex gap-4 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
            >
              キャンセル
            </Button>{" "}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete()}
            >
              削除
            </Button>{" "}
          </div>
        </div>
      </Modal>
    </div>
  );
}
