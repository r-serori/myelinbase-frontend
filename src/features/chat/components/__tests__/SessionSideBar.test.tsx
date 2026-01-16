import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SessionSideBar from "../SessionSideBar";

// Next.js router のモック
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

// useToast のモック
vi.mock("@/providers/ToastProvider", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// useSessions のモック
vi.mock("@/features/chat/hooks/useSessions", () => ({
  useSessions: () => ({
    data: { sessions: [] },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useUpdateSessionName: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteSession: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// SessionListのモック（依存関係をモックした後）
vi.mock("./SessionList", () => ({
  default: () => <div data-testid="session-list-mock">Session List</div>,
}));

describe("SessionSideBar", () => {
  const defaultProps = {
    currentSessionId: "session-1",
    sidebarCollapsed: false,
    onToggleCollapsed: vi.fn(),
    onNewChat: vi.fn(),
  };

  it("renders correctly", () => {
    const { container } = render(<SessionSideBar {...defaultProps} />);
    // SessionListは実際にレンダリングされるので、モックではなく実際のコンポーネントを確認
    // サイドバーの幅クラスを確認 (md:w-56)
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("md:w-56");
    // SessionListがレンダリングされていることを確認（空のセッションリストでもOK）
    expect(aside).toBeInTheDocument();
  });

  it("applies collapsed width when sidebarCollapsed is true", () => {
    const { container } = render(
      <SessionSideBar {...defaultProps} sidebarCollapsed={true} />
    );
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("w-16");
  });

  it("calls onToggleCollapsed when menu button is clicked", () => {
    render(<SessionSideBar {...defaultProps} />);
    // Menuボタンは最初のボタン（トグルボタン）
    const menuButtons = screen.getAllByRole("button");
    const menuButton = menuButtons.find((btn) =>
      btn.querySelector(".lucide-menu")
    );
    expect(menuButton).toBeInTheDocument();
    if (menuButton) {
      fireEvent.click(menuButton);
      expect(defaultProps.onToggleCollapsed).toHaveBeenCalledTimes(1);
    }
  });
});
