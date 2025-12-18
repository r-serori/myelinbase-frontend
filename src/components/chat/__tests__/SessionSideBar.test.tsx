import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SessionSideBar from "../SessionSideBar";

// SessionListのモック
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
    render(<SessionSideBar {...defaultProps} />);
    expect(screen.getByTestId("session-list-mock")).toBeInTheDocument();
    // サイドバーの幅クラスを確認 (md:w-56)
    const aside = screen.getByRole("complementary");
    expect(aside).toHaveClass("md:w-56");
  });

  it("applies collapsed width when sidebarCollapsed is true", () => {
    render(<SessionSideBar {...defaultProps} sidebarCollapsed={true} />);
    const aside = screen.getByRole("complementary");
    expect(aside).toHaveClass("w-16");
  });

  it("calls onToggleCollapsed when menu button is clicked", () => {
    render(<SessionSideBar {...defaultProps} />);
    const menuButton = screen.getByRole("button"); // Menu icon button
    fireEvent.click(menuButton);
    expect(defaultProps.onToggleCollapsed).toHaveBeenCalledTimes(1);
  });
});
