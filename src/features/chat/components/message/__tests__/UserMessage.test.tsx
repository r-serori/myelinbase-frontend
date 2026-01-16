import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import UserMessage from "../UserMessage";

// クリップボードのモック
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe("UserMessage", () => {
  const defaultProps = {
    text: "Hello World",
    createdAt: "2023-01-01T10:00:00Z",
    isLatest: true,
    historyId: "hist-1",
    onCopy: vi.fn(),
    onEditAndResend: vi.fn(),
  };

  it("renders text and date", () => {
    render(<UserMessage {...defaultProps} />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    // タイムゾーンの影響で時間がずれる可能性があるため、日付部分のみ確認するか、正規表現を使う
    expect(screen.getByText(/2023\/01\/01/)).toBeInTheDocument();
  });

  it("calls onCopy when copy button is clicked", () => {
    render(<UserMessage {...defaultProps} />);
    // Copy icon button (first button)
    const buttons = screen.getAllByRole("button");
    // Copyボタンは最初
    fireEvent.click(buttons[0]);
    expect(defaultProps.onCopy).toHaveBeenCalledWith("Hello World");
  });

  it("toggles edit mode", () => {
    render(<UserMessage {...defaultProps} />);

    // Pencil icon button (second button if isLatest is true)
    const buttons = screen.getAllByRole("button");
    const editButton = buttons[1]; // Pencil

    // Enter edit mode
    fireEvent.click(editButton);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hello World")).toBeInTheDocument();
    expect(screen.getByText("キャンセル")).toBeInTheDocument();
    expect(screen.getByText("更新")).toBeInTheDocument();
  });

  it("cancels edit", () => {
    render(<UserMessage {...defaultProps} />);

    // Enter edit mode
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);

    // Change text
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Edited Text" } });

    // Cancel
    fireEvent.click(screen.getByText("キャンセル"));

    // Should revert to original text display
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("submits edit", () => {
    render(<UserMessage {...defaultProps} />);

    // Enter edit mode
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);

    // Change text
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Edited Text" } });

    // Submit
    fireEvent.click(screen.getByText("更新"));

    expect(defaultProps.onEditAndResend).toHaveBeenCalledWith(
      "Edited Text",
      "hist-1"
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("does not show edit button if not latest", () => {
    render(<UserMessage {...defaultProps} isLatest={false} />);
    // Only copy button should be present
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
  });
});
