"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CircleQuestionMark, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Text } from "./Text";
import Tooltip from "./ToolTip";

interface ModalProps {
  isOpen: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
  title?: string;
  tooltipContent?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}

/**
 * モーダルの枠組み（オーバーレイ + コンテナ）
 */
export function Modal({
  isOpen,
  size = "sm",
  title,
  tooltipContent,
  className,
  children,
  onClose,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-background shadow-2xl overflow-hidden flex flex-col",
          "w-full h-full rounded-none border-0",
          "sm:h-auto sm:max-h-[80vh] sm:rounded-xl sm:border sm:border-border",
          size === "xs" && "sm:max-w-xs",
          size === "sm" && "sm:max-w-sm",
          size === "md" && "sm:max-w-md",
          size === "lg" && "sm:max-w-lg",
          size === "xl" && "sm:max-w-xl",
          size === "2xl" && "sm:max-w-2xl",
          size === "3xl" && "sm:max-w-3xl",
          className
        )}
      >
        <ModalHeader
          title={title}
          tooltipContent={tooltipContent}
          onClose={onClose}
        />
        <ModalBody>{children}</ModalBody>
      </div>
    </div>,
    document.body
  );
}

/**
 * モーダルのヘッダー部分（タイトル + 閉じるボタン）
 */
export function ModalHeader({
  title,
  tooltipContent,
  onClose,
  className,
}: {
  title?: string;
  tooltipContent?: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-gray-100 shrink-0 px-4 py-2",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Text
          variant="lg"
          weight="semibold"
          className="flex items-center gap-2"
        >
          {title ?? ""}
        </Text>
        {tooltipContent && (
          <Tooltip position="top-[8px] left-60">{tooltipContent}</Tooltip>
        )}
      </div>
      <Button variant="close" size="close" onClick={onClose}>
        <X className="size-5" />
      </Button>
    </div>
  );
}

/**
 * モーダルのコンテンツ部分（スクロール可能）
 */
export function ModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-y-auto p-4 flex-1", className)}>
      {children}
    </div>
  );
}

/**
 * モーダルのフッター部分（アクションボタン等）
 */
export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 shrink-0",
        className
      )}
    >
      {children}
    </div>
  );
}
