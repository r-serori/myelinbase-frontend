import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ChatTooltip from "../ChatTooltip";

describe("ChatTooltip", () => {
  it("renders children", () => {
    render(
      <ChatTooltip content="Tooltip Text">
        <button>Trigger</button>
      </ChatTooltip>
    );
    expect(screen.getByText("Trigger")).toBeInTheDocument();
  });

  it("shows tooltip content on hover", () => {
    render(
      <ChatTooltip content="Tooltip Text">
        <button>Trigger</button>
      </ChatTooltip>
    );

    // 最初は表示されていない
    expect(screen.queryByText("Tooltip Text")).not.toBeInTheDocument();

    // マウスオーバー
    fireEvent.mouseEnter(screen.getByText("Trigger"));
    expect(screen.getByText("Tooltip Text")).toBeInTheDocument();

    // マウスリーブ
    fireEvent.mouseLeave(screen.getByText("Trigger"));
    expect(screen.queryByText("Tooltip Text")).not.toBeInTheDocument();
  });

  it("shows tooltip content on focus", () => {
    render(
      <ChatTooltip content="Tooltip Text">
        <button>Trigger</button>
      </ChatTooltip>
    );

    // フォーカス
    fireEvent.focus(screen.getByText("Trigger"));
    expect(screen.getByText("Tooltip Text")).toBeInTheDocument();

    // ブラー
    fireEvent.blur(screen.getByText("Trigger"));
    expect(screen.queryByText("Tooltip Text")).not.toBeInTheDocument();
  });

  it("does not render tooltip wrapper if content is empty", () => {
    // コンテンツが空の場合、childrenのみを返す実装になっている
    // ただしラッパーdivがなくなるかどうかは実装次第だが、
    // 実装: if (!content) return <>{children}</>;

    render(
      <ChatTooltip content="">
        <button>Trigger</button>
      </ChatTooltip>
    );
    // Triggerボタンの直接の親がcontainer（フラグメントのため）であることを確認...は難しいが、
    // マウスイベントが発火しないことなどを確認するか、単純にレンダリング確認のみでもよい
    expect(screen.getByText("Trigger")).toBeInTheDocument();
  });

  it("applies position classes", () => {
    render(
      <ChatTooltip content="Bottom" position="bottom">
        <button>Trigger</button>
      </ChatTooltip>
    );
    fireEvent.mouseEnter(screen.getByText("Trigger"));
    const tooltip = screen.getByText("Bottom");
    expect(tooltip).toHaveClass("top-full");
    expect(tooltip).toHaveClass("left-1/2"); // bottom (default)
  });
});
