import { useRouter } from "next/navigation";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RequireAuth from "@/features/auth/components/RequireAuth";
import * as AuthContextModule from "@/features/auth/providers/AuthProvider";

// モックの設定
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/features/auth/providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

// Loadingコンポーネントをモック化
vi.mock("@/components/ui/Loading", () => ({
  default: () => <div data-testid="loading-mock">Loading...</div>,
}));

describe("RequireAuth", () => {
  const replaceMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: replaceMock,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("shows loading state initially", () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      isLoading: true,
    } as unknown as ReturnType<typeof AuthContextModule.useAuth>);

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
    } as unknown as ReturnType<typeof AuthContextModule.useAuth>);

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
    } as unknown as ReturnType<typeof AuthContextModule.useAuth>);

    render(
      <RequireAuth>
        <div>Protected Content</div>
      </RequireAuth>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
