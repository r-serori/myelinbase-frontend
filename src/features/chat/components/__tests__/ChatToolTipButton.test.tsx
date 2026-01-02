import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ChatToolTipButton from "../ChatToolTipButton";

// Iconモック
const MockIcon = ({ className }: { className?: string }) => (
  <div data-testid="mock-icon" className={className} />
);

// ChatTooltipは動作確認済みとして、ここでは単純なラッパーとして扱うか、
// あるいはインテグレーションテストとしてそのまま使う。
// 依存を減らすならモック化だが、ChatTooltipは軽量なのでそのままでも良い。
// ここではモック化せずにテストする。

describe("ChatToolTipButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders button with icon", () => {
    render(
      <ChatToolTipButton content="Tooltip" onClick={() => {}} Icon={MockIcon} />
    );
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();

    // Tooltip content check (via hover)
    fireEvent.mouseEnter(screen.getByRole("button"));
    expect(screen.getByText("Tooltip")).toBeInTheDocument();
  });

  it("calls onClick and handles click animation", () => {
    const handleClick = vi.fn();
    render(
      <ChatToolTipButton
        content="Tooltip"
        onClick={handleClick}
        Icon={MockIcon}
      />
    );

    const button = screen.getByRole("button");

    // Click
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Clicked state classes
    expect(button).toHaveClass("tooltip-button-clicked");
    const icon = screen.getByTestId("mock-icon");
    expect(icon).toHaveClass("tooltip-icon-clicked");

    // Animation timeout (220ms)
    act(() => {
      vi.advanceTimersByTime(220);
    });

    // Classes should be removed
    expect(button).not.toHaveClass("tooltip-button-clicked");
  });

  it("applies active styles", () => {
    render(
      <ChatToolTipButton
        content="Tooltip"
        onClick={() => {}}
        Icon={MockIcon}
        active={true}
        variant="good"
      />
    );

    const icon = screen.getByTestId("mock-icon");
    expect(icon).toHaveClass("text-primary");
    expect(icon).toHaveClass("icon-bounce-up");
  });

  it("applies inactive styles", () => {
    render(
      <ChatToolTipButton
        content="Tooltip"
        onClick={() => {}}
        Icon={MockIcon}
        active={false}
      />
    );

    const icon = screen.getByTestId("mock-icon");
    expect(icon).toHaveClass("text-muted-foreground");
  });
});
