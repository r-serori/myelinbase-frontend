import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FeedbackModalProps } from "../../FeedbackModal";
import AiMessage from "../AiMessage";

// MarkdownViewerモック
vi.mock("@/features/chat/components/message/MarkdownViewer", () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="markdown-content">{content || ""}</div>
  ),
}));

// SourceDocumentListモック
vi.mock("@/features/chat/components/message/SourceDocumentList", () => ({
  default: () => <div data-testid="source-list">Sources</div>,
}));

// FeedbackModalモック
vi.mock("@/features/chat/components/FeedbackModal", () => ({
  default: ({
    isOpen,
    feedbackType,
    goodReasons,
    badReasons,
    selectedReasons,
    feedbackComment,
    onToggleReason,
    onChangeComment,
    onClose,
    onSubmit,
  }: FeedbackModalProps) =>
    isOpen ? (
      <div data-testid="feedback-modal">
        <button onClick={() => onToggleReason("Reason 1")}>
          Toggle Reason
        </button>
        <button onClick={onSubmit}>Submit</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// FeedbackToastモック
vi.mock("@/features/chat/components/FeedbackToast", () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="feedback-toast">{message}</div>
  ),
}));

describe("AiMessage", () => {
  const defaultProps = {
    text: "AI Response",
    createdAt: "2023-01-01T10:00:00Z",
    isLatest: true,
    historyId: "hist-1",
    isGenerating: false,
    currentVersion: 1,
    totalVersions: 1,
    sourceDocuments: [],
    onCopy: vi.fn(),
    onRedo: vi.fn(),
    onPrevVersion: vi.fn(),
    onNextVersion: vi.fn(),
    onSourceClick: vi.fn(),
    onGoodFeedback: vi.fn(),
    onBadFeedback: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders text and date", () => {
    render(<AiMessage {...defaultProps} />);
    // MarkdownViewerがレンダリングされる
    const markdownContent = screen.getByTestId("markdown-content");
    expect(markdownContent).toHaveTextContent("AI Response");
    // タイムゾーンの影響で時間がずれる可能性があるため、日付部分のみ確認するか、正規表現を使う
    expect(screen.getByText(/2023\/01\/01/)).toBeInTheDocument();
  });

  it("renders generating state", () => {
    // isGenerating=true かつ textが空の場合のみローディング表示
    render(<AiMessage {...defaultProps} text="" isGenerating={true} />);
    expect(
      screen.getByText("Myelin Baseが応答を生成しています...")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("markdown-content")).not.toBeInTheDocument();
  });

  it("renders source documents if present", () => {
    render(
      <AiMessage
        {...defaultProps}
        sourceDocuments={[
          { documentId: "1", fileName: "doc", text: "", score: 1 },
        ]}
      />
    );
    expect(screen.getByTestId("source-list")).toBeInTheDocument();
  });

  it("handles good feedback", async () => {
    render(<AiMessage {...defaultProps} />);

    // Good button (ThumbsUp icon)
    // ChatToolTipButtonの実装によるが、アイコンかツールチップ内容で探す
    // ここではボタンの順序に依存するか、モック化して特定しやすくするのが良いが、
    // ChatToolTipButtonは既にテスト済み。
    // AiMessage内の実装順序: Good, Bad, Redo, Copy
    const buttons = screen.getAllByRole("button");
    const goodButton = buttons[0];

    fireEvent.click(goodButton);

    expect(defaultProps.onGoodFeedback).toHaveBeenCalledWith("hist-1");
    // showFeedbackToastがtrueになるとFeedbackToastが表示される
    await waitFor(
      () => {
        expect(screen.getByTestId("feedback-toast")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("handles bad feedback modal flow", async () => {
    render(<AiMessage {...defaultProps} />);

    // Bad button (2nd)
    const buttons = screen.getAllByRole("button");
    const badButton = buttons[1];

    fireEvent.click(badButton);

    // Modal opens (feedbackTypeがBADになると表示される)
    await waitFor(() => {
      expect(screen.getByTestId("feedback-modal")).toBeInTheDocument();
    });

    // Interact with modal mock
    fireEvent.click(screen.getByText("Toggle Reason"));
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(defaultProps.onBadFeedback).toHaveBeenCalled();
      expect(screen.getByTestId("feedback-toast")).toBeInTheDocument();
    });
  });

  it("handles redo", () => {
    render(<AiMessage {...defaultProps} />);
    // Redo (3rd)
    const buttons = screen.getAllByRole("button");
    const redoButton = buttons[2];
    fireEvent.click(redoButton);
    expect(defaultProps.onRedo).toHaveBeenCalled();
  });

  it("handles copy", () => {
    render(<AiMessage {...defaultProps} />);
    // Copy (4th)
    const buttons = screen.getAllByRole("button");
    const copyButton = buttons[3];
    fireEvent.click(copyButton);
    expect(defaultProps.onCopy).toHaveBeenCalledWith("AI Response");
  });

  it("renders version controls when multiple versions", () => {
    render(
      <AiMessage {...defaultProps} totalVersions={2} currentVersion={1} />
    );

    // Prev/Next buttons should appear
    // 既存の4つのボタン + 2つ (Prev, Next) = 6つ
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(4);

    const prevButton = buttons[buttons.length - 2];
    const nextButton = buttons[buttons.length - 1];

    expect(prevButton).toBeDisabled(); // current=1
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);
    expect(defaultProps.onNextVersion).toHaveBeenCalled();
  });
});
