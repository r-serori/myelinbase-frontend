import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SessionList from "../SessionList";

// Hooksモック
const mutateUpdateName = vi.fn();
const mutateDeleteSession = vi.fn();

vi.mock("@/hooks/useSessions", () => ({
  useSessions: () => ({
    data: {
      sessions: [
        {
          sessionId: "1",
          sessionName: "Session 1",
          lastMessageAt: "2023-01-01T10:00:00Z",
        },
        {
          sessionId: "2",
          sessionName: "Session 2",
          lastMessageAt: "2023-01-02T10:00:00Z",
        },
      ],
    },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useUpdateSessionName: () => ({
    mutateAsync: mutateUpdateName,
  }),
  useDeleteSession: () => ({
    mutateAsync: mutateDeleteSession,
  }),
}));

vi.mock("@/hooks/useQueryErrorToast", () => ({
  useQueryErrorToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

const showToastMock = vi.fn();
vi.mock("../ui/ToastProvider", () => ({
  useToast: () => ({
    showToast: showToastMock,
  }),
}));

describe("SessionList", () => {
  const defaultProps = {
    currentSessionId: "1",
    sidebarCollapsed: false,
    onNewChat: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mutateUpdateName.mockResolvedValue({ status: "success" });
    mutateDeleteSession.mockResolvedValue({ status: "success" });
  });

  it("renders session list", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByText("Session 1")).toBeInTheDocument();
    expect(screen.getByText("Session 2")).toBeInTheDocument();
  });

  it("renders new chat button", () => {
    render(<SessionList {...defaultProps} />);
    expect(screen.getByText("チャットを新規作成")).toBeInTheDocument();
  });

  it("calls onNewChat when button clicked", () => {
    render(<SessionList {...defaultProps} />);
    const newChatButton = screen
      .getByText("チャットを新規作成")
      .closest("button");
    fireEvent.click(newChatButton!);
    expect(defaultProps.onNewChat).toHaveBeenCalledTimes(1);
  });

  it("shows menu on hover/click", () => {
    render(<SessionList {...defaultProps} />);
    // メニューボタンは初期状態ではopacity-0だが、DOMには存在するはず
    // sessionId=1 のリンクに対応するメニューボタンを探す
    // 実装: Linkの兄弟要素にButtonがある

    // session-link-1 の親要素内にあるボタンを探す
    const link = document.getElementById("session-link-1");
    const menuButton = link?.parentElement?.querySelector("button");

    expect(menuButton).toBeInTheDocument();

    // クリックしてメニューを開く
    fireEvent.click(menuButton!);

    expect(screen.getByText("名前を変更")).toBeInTheDocument();
    expect(screen.getByText("削除")).toBeInTheDocument();
  });

  it("opens edit modal and saves name", async () => {
    render(<SessionList {...defaultProps} />);

    // メニューを開く
    const link = document.getElementById("session-link-1");
    const menuButton = link?.parentElement?.querySelector("button");
    fireEvent.click(menuButton!);

    // 編集ボタンクリック
    fireEvent.click(screen.getByText("名前を変更"));

    // モーダルが表示される
    expect(screen.getByText("チャット名を変更")).toBeInTheDocument();

    // 入力変更
    const input = screen.getByDisplayValue("Session 1");
    fireEvent.change(input, { target: { value: "Updated Session" } });

    // 保存
    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(mutateUpdateName).toHaveBeenCalledWith({
        sessionId: "1",
        sessionName: "Updated Session",
      });
    });
  });

  it("opens delete modal and deletes session", async () => {
    render(<SessionList {...defaultProps} />);

    // メニューを開く
    const link = document.getElementById("session-link-1");
    const menuButton = link?.parentElement?.querySelector("button");
    fireEvent.click(menuButton!);

    // 削除ボタンクリック
    fireEvent.click(screen.getByText("削除"));

    // モーダルが表示される
    expect(screen.getByText("チャットを削除")).toBeInTheDocument();
    expect(
      screen.getByText("このチャット履歴を削除しますか？")
    ).toBeInTheDocument();

    // 削除実行（モーダル内の削除ボタンは2つあるうちの後者、variant="destructive"）
    // "削除" テキストを持つボタンが複数ある（メニュー内とモーダル内）
    // モーダル内の削除ボタンを特定する
    const deleteButtons = screen.getAllByText("削除");
    // 最後の一つがモーダル内のボタンのはず
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(mutateDeleteSession).toHaveBeenCalledWith("1");
    });
  });
});
