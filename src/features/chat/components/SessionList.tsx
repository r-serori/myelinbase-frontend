"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom"; // 追加
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
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);

  const isUpdating = updateSessionName.isPending;
  const isDeleting = deleteSession.isPending;

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

  const handleMenuToggle = (
    e: React.MouseEvent<HTMLButtonElement>,
    sessionId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (menuOpenId === sessionId) {
      setMenuOpenId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.top,
        left: rect.right + 5,
      });
      setMenuOpenId(sessionId);
    }
  };

  const handleScroll = () => {
    if (menuOpenId) {
      setMenuOpenId(null);
    }
  };

  const handleEditStart = (sessionId: string, currentName: string) => {
    setEditingId(sessionId);
    setEditName(currentName);
    setMenuOpenId(null);
  };

  const handleEditSave = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      await updateSessionName.mutateAsync({
        sessionId: editingId,
        sessionName: editName.trim(),
      });
      showToast({ type: "success", message: "チャット名を更新しました" });
      setEditingId(null);
    } catch (err: unknown) {
      handleCommonError(
        err,
        setErrorMessage,
        showToast,
        "チャット名の更新に失敗しました"
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteSessionId) return;

    try {
      await deleteSession.mutateAsync(deleteSessionId);
      if (currentSessionId === deleteSessionId) {
        router.replace("/chat");
      }
      showToast({ type: "success", message: "チャットを削除しました" });
      setDeleteModalOpen(false);
      setDeleteSessionId(null);
    } catch (err: unknown) {
      handleCommonError(
        err,
        setErrorMessage,
        showToast,
        "チャットの削除に失敗しました"
      );
    }

    setMenuOpenId(null);
  };

  const handleEditModalClose = () => {
    if (isUpdating) return;
    setEditingId(null);
    setErrorMessage("");
  };

  const handleDeleteModalClose = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setDeleteSessionId(null);
    setErrorMessage("");
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
            <ul
              className={`space-y-1 px-2 py-2 flex-1 overflow-y-auto`}
              onScroll={handleScroll}
            >
              {sessions.map((s) => {
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
                        aria-label="チャットメニュー"
                        variant="close"
                        size="icon"
                        className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                          menuOpenId === s.sessionId &&
                          "opacity-100 text-primary"
                        }`}
                        onClick={(e) => handleMenuToggle(e, s.sessionId)}
                      >
                        <MoreVertical className="size-4" />
                      </Button>

                      {menuOpenId === s.sessionId &&
                        menuPosition &&
                        createPortal(
                          <div
                            ref={menuRef}
                            style={{
                              position: "fixed",
                              top: `${menuPosition.top}px`,
                              left: `${menuPosition.left}px`,
                            }}
                            className="w-32 bg-background border border-muted rounded shadow-lg z-[9999] overflow-hidden"
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
                          </div>,
                          document.body
                        )}
                    </div>
                    {isEditing && (
                      <Modal
                        isOpen={isEditing}
                        title="チャット名を変更"
                        onClose={handleEditModalClose}
                        size="md"
                      >
                        <div className="flex flex-col gap-4">
                          <Input
                            size="full"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                            disabled={isUpdating}
                          />
                          {errorMessage && (
                            <Text
                              variant="sm"
                              color="destructive"
                              leading="relaxed"
                            >
                              {errorMessage}
                            </Text>
                          )}
                          <div className="flex gap-4 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleEditModalClose}
                              disabled={isUpdating}
                            >
                              キャンセル
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleEditSave}
                              disabled={isUpdating || !editName.trim()}
                              className={`flex items-center gap-1
                                ${
                                  isUpdating || !editName.trim()
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                            >
                              {isUpdating ? (
                                <Spinner size="3.5" color="background" />
                              ) : (
                                <Edit className="size-3.5" />
                              )}
                              <Text
                                variant="sm"
                                color="white"
                                weight="semibold"
                                as="span"
                                className={
                                  isUpdating ? "thinking-text-button" : ""
                                }
                              >
                                {isUpdating ? "保存中..." : "保存"}
                              </Text>
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
        onClose={handleDeleteModalClose}
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
              onClick={handleDeleteModalClose}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete()}
              disabled={isDeleting}
              className={`
                ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}
                flex items-center gap-1
              }`}
            >
              {isDeleting ? (
                <Spinner size="3.5" color="background" />
              ) : (
                <Trash className="size-3.5" />
              )}
              <Text
                variant="sm"
                color="white"
                weight="semibold"
                as="span"
                className={isDeleting ? "thinking-text-button" : ""}
              >
                {isDeleting ? "削除中..." : "削除"}
              </Text>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
