"use client";
import Link from "next/link";
import {
  useSessions,
  useUpdateSessionName,
  useDeleteSession,
} from "@/hooks/useSessions";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { getErrorMessage } from "@/lib/error-mapping";
import { Edit, MoreVertical, Trash, Check, X } from "lucide-react";
import dayjs from "dayjs";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "../ui/Spinner";
import { Button } from "../ui/Button";
import ChatTooltip from "./ChatTooltip";
import Input from "../ui/Input";
import { Modal, ModalBody, ModalHeader } from "../ui/Modal";
import { Text } from "../ui/Text";
import { useToast } from "../ui/ToastProvider";

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

  // ★ 新規チャット作成中かどうかを確認
  // ChatGenerationContextはComponent内から直接呼べないので、SessionSideBar等からpropsで渡すか、
  // あるいはここでContextを使用する（SessionListはChatPage配下なので利用可能）
  // 循環依存を避けるため、ここではimportして使用する
  // 実際には useSessions が返すデータにマージするのが一番自然だが、
  // React QueryのCacheを直接操作するほうがUXが良い（ChatGenerationContext内で実装済み）

  const updateSessionName = useUpdateSessionName();
  const deleteSession = useDeleteSession();
  const sessions = data?.sessions ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
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
    } catch (err: any) {
      showToast({ type: "error", message: getErrorMessage(err) });
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
    } catch (err: any) {
      showToast({ type: "error", message: getErrorMessage(err) });
    }

    setMenuOpenId(null);
    setDeleteModalOpen(false);
    setDeleteSessionId(null);
  };

  return (
    <div className="transition-[max-height,opacity] duration-200 ease-out h-full flex flex-col overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
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
              {sessions.length === 0 && (
                <li className="text-sm text-muted-foreground px-3 py-2">
                  チャットを新規作成してみましょう！
                </li>
              )}
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
