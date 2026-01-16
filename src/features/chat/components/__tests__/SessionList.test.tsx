import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SessionList from "../SessionList";

// Hooksモック
const mutateUpdateName = vi.fn();
const mutateDeleteSession = vi.fn();

// デフォルトのモック状態を保持する変数
let mockUpdatePending = false;
let mockDeletePending = false;

vi.mock("@/features/chat/hooks/useSessions", () => ({
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
    isPending: mockUpdatePending,
  }),
  useDeleteSession: () => ({
    mutateAsync: mutateDeleteSession,
    isPending: mockDeletePending,
  }),
}));

vi.mock("@/hooks/useQueryErrorToast", () => ({
  useQueryErrorToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/chat",
  useSearchParams: () => new URLSearchParams(),
}));

const showToastMock = vi.fn();
vi.mock("@/providers/ToastProvider", () => ({
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
    mockUpdatePending = false;
    mockDeletePending = false;
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

  // ローディング状態のテスト
  describe("Loading states", () => {
    it("shows loading state when updating session name", async () => {
      // isPendingをtrueに設定
      mockUpdatePending = true;

      render(<SessionList {...defaultProps} />);

      // メニューを開く
      const link = document.getElementById("session-link-1");
      const menuButton = link?.parentElement?.querySelector("button");
      fireEvent.click(menuButton!);

      // 編集ボタンクリック
      fireEvent.click(screen.getByText("名前を変更"));

      // モーダルが表示される
      expect(screen.getByText("チャット名を変更")).toBeInTheDocument();

      // ローディング状態の確認
      expect(screen.getByText("保存中...")).toBeInTheDocument();

      // 入力が無効化されている
      const input = screen.getByDisplayValue("Session 1");
      expect(input).toBeDisabled();

      // キャンセルボタンが無効化されている
      const cancelButton = screen.getByText("キャンセル").closest("button");
      expect(cancelButton).toBeDisabled();

      // 保存ボタンが無効化されている
      const saveButton = screen.getByText("保存中...").closest("button");
      expect(saveButton).toBeDisabled();
    });

    it("shows loading state when deleting session", async () => {
      // isPendingをtrueに設定
      mockDeletePending = true;

      render(<SessionList {...defaultProps} />);

      // メニューを開く
      const link = document.getElementById("session-link-1");
      const menuButton = link?.parentElement?.querySelector("button");
      fireEvent.click(menuButton!);

      // 削除ボタンクリック（メニュー内）
      const menuDeleteButton = screen.getByText("削除");
      fireEvent.click(menuDeleteButton);

      // モーダルが表示される
      expect(screen.getByText("チャットを削除")).toBeInTheDocument();

      // ローディング状態の確認
      expect(screen.getByText("削除中...")).toBeInTheDocument();

      // キャンセルボタンが無効化されている
      const cancelButton = screen.getByText("キャンセル").closest("button");
      expect(cancelButton).toBeDisabled();

      // 削除ボタンが無効化されている
      const deleteButton = screen.getByText("削除中...").closest("button");
      expect(deleteButton).toBeDisabled();
    });

    it("disables save button when input is empty", () => {
      render(<SessionList {...defaultProps} />);

      // メニューを開く
      const link = document.getElementById("session-link-1");
      const menuButton = link?.parentElement?.querySelector("button");
      fireEvent.click(menuButton!);

      // 編集ボタンクリック
      fireEvent.click(screen.getByText("名前を変更"));

      // 入力を空にする
      const input = screen.getByDisplayValue("Session 1");
      fireEvent.change(input, { target: { value: "" } });

      // 保存ボタンが無効化されている
      const saveButton = screen.getByText("保存").closest("button");
      expect(saveButton).toBeDisabled();
    });

    it("disables save button when input is only whitespace", () => {
      render(<SessionList {...defaultProps} />);

      // メニューを開く
      const link = document.getElementById("session-link-1");
      const menuButton = link?.parentElement?.querySelector("button");
      fireEvent.click(menuButton!);

      // 編集ボタンクリック
      fireEvent.click(screen.getByText("名前を変更"));

      // 入力を空白のみにする
      const input = screen.getByDisplayValue("Session 1");
      fireEvent.change(input, { target: { value: "   " } });

      // 保存ボタンが無効化されている
      const saveButton = screen.getByText("保存").closest("button");
      expect(saveButton).toBeDisabled();
    });
  });
});
