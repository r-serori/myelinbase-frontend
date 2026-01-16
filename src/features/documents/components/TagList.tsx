import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import TagChip from "@/features/documents/components/TagChip";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export default function TagList({
  tags,
  onTagClick,
}: {
  tags: string[] | undefined;
  onTagClick?: (tag: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // ポップオーバーを開く処理
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    // ボタンの位置を計算してセット
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // 画面下端にはみ出る場合は上に表示するなどのロジックも入れられますが
      // ここではシンプルに下方向固定とします
      setPopoverPos({
        top: rect.bottom + 4,
        left: rect.left + rect.width / 2,
      });
      setIsOpen(true);
    }
  };

  // 外側クリックとスクロール検知で閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // ボタン自体か、ポップオーバー内部のクリックなら閉じない
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleScroll = (event: Event) => {
      // 修正: ポップオーバー内部のスクロールイベントなら閉じない
      if (
        popoverRef.current &&
        event.target instanceof Node &&
        popoverRef.current.contains(event.target)
      ) {
        return;
      }
      // それ以外（親画面のスクロール）なら位置ズレを防ぐために閉じる
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    // capture: true にしないと、div内のスクロールイベントが拾えない場合があるが
    // 逆に拾いすぎるので判定を入れる
    window.addEventListener("scroll", handleScroll, { capture: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [isOpen]);

  if (!tags || tags.length === 0) {
    return <span className="text-xs text-gray-600">タグ未設定</span>;
  }

  const VISIBLE_COUNT = 3;
  const visibleTags = tags.slice(0, VISIBLE_COUNT);
  const hiddenTags = tags.slice(VISIBLE_COUNT);

  return (
    <>
      <div className="flex gap-1 justify-center items-center whitespace-nowrap">
        {visibleTags.map((t) => (
          <TagChip key={t} tag={t} onClick={onTagClick} />
        ))}

        {hiddenTags.length > 0 && (
          <Button
            aria-label="すべてのタグを表示"
            variant="outline"
            size="xxs"
            className={`shadow-none ${
              isOpen &&
              "bg-accent text-accent-foreground border-accent-foreground/20"
            }`}
            ref={buttonRef}
            onClick={handleToggle}
            title="すべてのタグを表示"
          >
            +{hiddenTags.length}
          </Button>
        )}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-60 w-56 p-2 bg-white border rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: popoverPos.top,
              left: popoverPos.left,
              transform: "translateX(-50%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-gray-100">
              <Text variant="xs" color="muted" className="px-1">
                タグ一覧 ({tags.length})
              </Text>
              <Button
                aria-label="タグ一覧を閉じる"
                variant="iconSmall"
                size="iconSmall"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
              {tags.map((t, index) => (
                <TagChip
                  key={index}
                  tag={t}
                  onClick={() => {
                    onTagClick?.(t);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
