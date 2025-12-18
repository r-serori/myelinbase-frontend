import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ChatMessagesPane from "../ChatMessagesPane";
import { createRef } from "react";

// モック
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { nickname: "TestUser" },
  }),
}));

vi.mock("@/hooks/useMessageGrouping", () => ({
  useMessageGrouping: (messages: any[]) => ({
    displayItems: messages.map((m) => ({
      ...m,
      versionInfo: { current: 1, total: 1, onPrev: () => {}, onNext: () => {} },
    })),
  }),
}));

// 子コンポーネントのモック
vi.mock("./message/UserMessage", () => ({
  default: ({ text }: { text: string }) => (
    <div data-testid="user-message">{text}</div>
  ),
}));

vi.mock("./message/AiMessage", () => ({
  default: ({
    text,
    isGenerating,
  }: {
    text: string;
    isGenerating: boolean;
  }) => (
    <div data-testid="ai-message" data-generating={isGenerating}>
      {text}
    </div>
  ),
}));

describe("ChatMessagesPane", () => {
  const defaultProps = {
    sessionId: "session-1",
    messages: [],
    isLoading: false,
    pendingUserMessage: null,
    pendingCreatedAt: null,
    redoingHistoryId: null,
    streamingAnswer: null,
    latestUserMessageRef: createRef<HTMLDivElement>(),
    onDoSend: vi.fn(),
    feedbackMutation: { mutate: vi.fn() },
    bottomPadding: 100,
    formHeight: 60,
    isStreaming: false,
    onSourceClick: vi.fn(),
  };

  it("renders welcome message when no messages", () => {
    render(<ChatMessagesPane {...defaultProps} />);
    expect(screen.getByText("TestUserさん、こんにちは！")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(<ChatMessagesPane {...defaultProps} isLoading={true} />);
    // LightLoadingコンポーネントが表示されるはず（詳細は実装依存だが、TestUser挨拶は出ないはず）
    expect(
      screen.queryByText("TestUserさん、こんにちは！")
    ).not.toBeInTheDocument();
  });

  it("renders messages", () => {
    const messages = [
      {
        historyId: "1",
        userQuery: "Hello",
        aiResponse: "Hi there",
        createdAt: "2023-01-01",
        sourceDocuments: [],
        feedback: "NONE",
      },
    ];
    // @ts-ignore
    render(<ChatMessagesPane {...defaultProps} messages={messages} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });

  it("renders pending user message", () => {
    render(
      <ChatMessagesPane
        {...defaultProps}
        pendingUserMessage="Pending Query"
        isStreaming={true}
      />
    );

    expect(screen.getByText("Pending Query")).toBeInTheDocument();
    // AI応答はまだ空（streamingAnswerがない場合）
    // AiMessageモックが空文字でレンダリングされる
    const aiMessage = screen.getByTestId("ai-message");
    expect(aiMessage).toBeInTheDocument();
    expect(aiMessage).toHaveAttribute("data-generating", "true");
  });

  it("renders streaming answer", () => {
    render(
      <ChatMessagesPane
        {...defaultProps}
        pendingUserMessage="Query"
        streamingAnswer="Streaming..."
        isStreaming={true}
      />
    );

    expect(screen.getByText("Streaming...")).toBeInTheDocument();
  });
});
