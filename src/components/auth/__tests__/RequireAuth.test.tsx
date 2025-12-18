import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RequireAuth from "../RequireAuth";
import * as AuthContextModule from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";

// モックの設定
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Loadingコンポーネントをモック化
vi.mock("../ui/Loading", () => ({
  default: () => <div data-testid="loading-mock">Loading...</div>,
}));

describe("RequireAuth", () => {
  const replaceMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: replaceMock,
    } as any);
  });

  it("shows loading state initially", () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      isLoading: true,
    } as any);

    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    );

    expect(screen.getByTestId("loading-mock")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to login if user is not authenticated", () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
    } as any);

    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    );

    expect(replaceMock).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders children if user is authenticated", () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: { id: "1", email: "test@example.com" },
      isLoading: false,
    } as any);

    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
