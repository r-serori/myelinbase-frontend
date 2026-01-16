import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ChatMessagesPane from "../ChatMessagesPane";

// モック
vi.mock("@/features/auth/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { nickname: "TestUser" },
  }),
}));

vi.mock("@/features/chat/hooks/useMessageGrouping", () => ({
  useMessageGrouping: (messages: unknown[]) => ({
    displayItems: messages.map((m: unknown) => ({
      ...(m as Record<string, unknown>),
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
    <div data-testid="ai-message" data-generating={String(isGenerating)}>
      {text || ""}
    </div>
  ),
}));

describe("ChatMessagesPane", () => {
  const mockFeedbackMutation = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: "idle" as const,
    isPending: false,
    isError: false as const,
    isSuccess: false as const,
    data: undefined,
    error: null,
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isIdle: true,
    isPaused: false,
    submittedAt: 0,
  } as unknown as ReturnType<
    typeof import("@/lib/api/generated/default/default").usePostChatFeedback
  >;

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
    feedbackMutation: mockFeedbackMutation,
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
    // @ts-expect-error - messages型が完全に一致しないが、テスト目的で許容
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
