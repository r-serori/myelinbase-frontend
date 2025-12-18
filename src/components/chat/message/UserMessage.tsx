import { useState, useRef, useEffect } from "react";
import { Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/utils";
import ChatToolTipButton from "../ChatToolTipButton";
import dayjs from "dayjs";

type Props = {
  text: string;
  createdAt?: string;
  isLatest?: boolean;
  historyId?: string;
  onCopy?: (text: string) => void;
  onEditAndResend?: (newText: string, historyId: string) => void;
};

export default function UserMessage({
  text,
  createdAt,
  isLatest,
  historyId,
  onCopy,
  onEditAndResend,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const editRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditText(text);
    }
  }, [text, isEditing]);

  useEffect(() => {
    if (isEditing && editRef.current) {
      const el = editRef.current;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [isEditing, editText]);

  const handleCopy = () => {
    if (onCopy) onCopy(text);
  };

  const handleEditPrompt = () => {
    setEditText(text);
    setIsEditing(true);
  };

  return (
    <div className="w-full flex mt-8 justify-end">
      <div className="w-full flex flex-col items-end max-w-full min-w-0">
        <div className={cn("flex flex-row", isEditing && "w-full")}>
          {!isEditing && (
            <div className="flex items-center mr-2 self-start mt-2">
              <ChatToolTipButton
                content="プロンプトをコピー"
                onClick={handleCopy}
                Icon={Copy}
              />
              {isLatest && (
                <ChatToolTipButton
                  content="プロンプトを編集"
                  onClick={handleEditPrompt}
                  Icon={Pencil}
                />
              )}
            </div>
          )}

          <div
            className={`rounded-xl px-4 py-3 text-sm max-w-full ${
              isEditing
                ? "w-full bg-white border border-primary/20"
                : "bg-primary/10"
            }`}
          >
            {isEditing ? (
              <>
                <textarea
                  ref={editRef}
                  id="edit-text"
                  className="w-full whitespace-pre-wrap p-2 break-words text-sm outline-none resize-none bg-transparent overflow-hidden"
                  value={editText}
                  style={{
                    minHeight: "24px",
                    maxHeight: "60vh",
                  }}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                />
                <div className="mt-2 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditText(text);
                      setIsEditing(false);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (onEditAndResend) {
                        onEditAndResend(editText, historyId ?? "");
                      }
                      setIsEditing(false);
                    }}
                  >
                    更新
                  </Button>
                </div>
              </>
            ) : (
              <Text
                variant="md"
                as="span"
                className="whitespace-pre-wrap break-words"
              >
                {editText}
              </Text>
            )}
            
            {createdAt && !isEditing && (
              <div className="mt-1 text-right">
                <Text variant="xs" color="muted" as="span">
                  {dayjs(createdAt).format("YYYY/MM/DD HH:mm")}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

