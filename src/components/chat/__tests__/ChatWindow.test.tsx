import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ChatWindow from "../ChatWindow";

// Hooksモック
vi.mock("@/hooks/useSessionMessages", () => ({
  useSessionMessages: () => ({
    data: { pages: [] },
    isLoading: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/hooks/useChatFeedback", () => ({
  useChatFeedback: vi.fn(),
}));

vi.mock("@/hooks/useChatGeneration", () => ({
  useChatGeneration: () => ({
    generate: vi.fn(),
    stop: vi.fn(),
    isLoading: false,
    streamingText: "",
    userQuery: "",
    createdAt: null,
    error: null,
  }),
}));

vi.mock("@/hooks/useDocuments", () => ({
  useGetDocumentDownloadUrl: () => ({
    mutateAsync: vi
      .fn()
      .mockResolvedValue({ downloadUrl: "http://example.com" }),
  }),
}));

vi.mock("@/hooks/useQueryErrorToast", () => ({
  useQueryErrorToast: vi.fn(),
}));

vi.mock("@/hooks/useChatScroll", () => ({
  useChatScroll: () => ({
    scrollRef: { current: null },
    onScroll: vi.fn(),
  }),
}));

const doSendMock = vi.fn();
const toggleRecordingMock = vi.fn();
const setInputMock = vi.fn();

vi.mock("@/hooks/useChatForm", () => ({
  useChatForm: () => ({
    input: "",
    setInput: setInputMock,
    isExpanded: false,
    setIsExpanded: vi.fn(),
    formHeight: 100,
    formRef: { current: null },
    inputRef: { current: null },
    doSend: doSendMock,
    isRecording: false,
    toggleRecording: toggleRecordingMock,
  }),
}));

const showToastMock = vi.fn();
vi.mock("../ui/ToastProvider", () => ({
  useToast: () => ({
    showToast: showToastMock,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// 子コンポーネントモック
vi.mock("./ChatInput", () => ({
  default: ({ onClickSendButton, input }: any) => (
    <div data-testid="chat-input">
      <button data-testid="send-button" onClick={onClickSendButton}>
        Send
      </button>
      <div data-testid="input-value">{input}</div>
    </div>
  ),
}));

vi.mock("./ChatMessagesPane", () => ({
  default: ({ onSourceClick }: any) => (
    <div data-testid="chat-messages-pane">
      <button
        data-testid="source-click"
        onClick={() => onSourceClick({ documentId: "doc-1" })}
      >
        Source
      </button>
    </div>
  ),
}));

// window.open
const windowOpenMock = vi.fn();
global.window.open = windowOpenMock;

describe("ChatWindow", () => {
  const defaultProps = {
    sessionId: "session-1",
    sidebarCollapsed: false,
    isDocumentPreviewOpen: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<ChatWindow {...defaultProps} />);
    expect(screen.getByTestId("chat-messages-pane")).toBeInTheDocument();
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
  });

  it("handles source click", async () => {
    render(<ChatWindow {...defaultProps} />);
    const sourceButton = screen.getByTestId("source-click");
    fireEvent.click(sourceButton);

    await waitFor(() => {
      expect(windowOpenMock).toHaveBeenCalledWith(
        "http://example.com",
        "_blank",
        "noopener,noreferrer"
      );
    });
  });

  it("handles send button click", () => {
    // Note: useChatFormのモックでinputが空の場合の挙動などが制御されている前提
    // ここではChatInputモックのonClickSendButtonが呼ばれたときに、useChatFormのdoSend等は呼ばれない（input空だから）
    // 逆にinputがある場合のテストをするにはuseChatFormのモックを調整する必要があるが、
    // 今回は簡易的に「ChatInputに渡されたonClickSendButtonが発火するか」を確認する
    // 実際のロジック（toggleRecordingなど）はChatWindowコンポーネント内にある

    render(<ChatWindow {...defaultProps} />);
    const sendButton = screen.getByTestId("send-button");
    fireEvent.click(sendButton);

    // inputが空の場合はtoggleRecordingが呼ばれるロジックになっている
    expect(toggleRecordingMock).toHaveBeenCalled();
  });
});
