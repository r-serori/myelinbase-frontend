"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Text } from "@/components/ui/Text";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  count?: number;
  isDeleting?: boolean;
}

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  count,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setInputValue("");
    }
  }

  const isMultiple = count && count > 1;
  const confirmText = isMultiple ? "全て削除" : title || "";
  const isMatch = inputValue === confirmText;

  return (
    <Modal isOpen={isOpen} title="削除の確認" size="lg" onClose={onClose}>
      <div className="space-y-4">
        <Text variant="md" leading="relaxed">
          {isMultiple ? (
            <>
              選択した
              <Text variant="md" weight="semibold" className="mx-1" as="span">
                {count}
              </Text>
              件のドキュメントを完全に削除しますか？
            </>
          ) : (
            <>
              「
              <Text variant="md" weight="semibold" as="span" className="mx-1">
                {title}
              </Text>
              」を完全に削除しますか？
            </>
          )}
          <br />
          <Text variant="md" color="destructive" as="span">
            ※ この操作は取り消すことができません。
          </Text>
        </Text>

        <div className="space-y-2 pt-2">
          <Text variant="md">
            確認のため、以下に「
            <Text variant="md" weight="semibold" as="span" className="mx-1">
              {confirmText}
            </Text>
            」と入力してください。
          </Text>
          <Input
            size="md"
            className="md:w-full"
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInputValue(e.target.value)
            }
            placeholder={confirmText}
            autoComplete="off"
            autoFocus
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isDeleting}
        >
          キャンセル
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onConfirm}
          disabled={isDeleting || !isMatch}
          className={!isMatch ? "opacity-50 cursor-not-allowed" : ""}
        >
          {isDeleting ? "削除中..." : "削除する"}
        </Button>
      </div>
    </Modal>
  );
}
