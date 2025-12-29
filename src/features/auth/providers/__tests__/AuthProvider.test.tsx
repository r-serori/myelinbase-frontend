import { act, render, screen, waitFor } from "@testing-library/react";
import * as AmplifyAuth from "aws-amplify/auth";
import { beforeEach, describe, expect, it, MockedFunction, vi } from "vitest";

import { AuthProvider, useAuth } from "../AuthProvider";

// Mock aws-amplify/auth
vi.mock("aws-amplify/auth", () => ({
  getCurrentUser: vi.fn(),
  fetchUserAttributes: vi.fn(),
  signOut: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Test Component to consume context
const TestComponent = () => {
  const { user, isLoading, logout } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not Logged In</div>;
  return (
    <div>
      <div>User: {user.username}</div>
      <div>Nickname: {user.nickname}</div>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    (
      AmplifyAuth.getCurrentUser as MockedFunction<
        typeof AmplifyAuth.getCurrentUser
      >
    ).mockResolvedValue({
      userId: "user-123",
      username: "testuser",
    });
    (
      AmplifyAuth.fetchUserAttributes as MockedFunction<
        typeof AmplifyAuth.fetchUserAttributes
      >
    ).mockResolvedValue({
      email: "test@example.com",
      nickname: "Test Nick",
    });
  });

  it("loads user on mount", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("User: testuser")).toBeInTheDocument();
      expect(screen.getByText("Nickname: Test Nick")).toBeInTheDocument();
    });

    expect(AmplifyAuth.getCurrentUser).toHaveBeenCalled();
    expect(AmplifyAuth.fetchUserAttributes).toHaveBeenCalled();
  });

  it("handles not signed in state", async () => {
    (
      AmplifyAuth.getCurrentUser as MockedFunction<
        typeof AmplifyAuth.getCurrentUser
      >
    ).mockRejectedValue(new Error("Not signed in"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Not Logged In")).toBeInTheDocument();
    });
  });

  it("handles logout", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("User: testuser")).toBeInTheDocument();
    });

    const logoutButton = screen.getByText("Logout");

    await act(async () => {
      logoutButton.click();
    });

    expect(AmplifyAuth.signOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("handles mock login when NEXT_PUBLIC_LOGIN_SKIP is true", async () => {
    // Save original env
    const originalEnv = process.env.NEXT_PUBLIC_LOGIN_SKIP;
    process.env.NEXT_PUBLIC_LOGIN_SKIP = "true";

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("User: MockUser")).toBeInTheDocument();
      expect(screen.getByText("Nickname: Mock User")).toBeInTheDocument();
    });

    expect(AmplifyAuth.getCurrentUser).not.toHaveBeenCalled();

    // Restore env
    process.env.NEXT_PUBLIC_LOGIN_SKIP = originalEnv;
  });
});
