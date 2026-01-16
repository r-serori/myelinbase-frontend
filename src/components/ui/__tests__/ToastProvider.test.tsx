import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "../../../providers/ToastProvider";
import { Button } from "../Button";

// テスト用コンポーネント
const TestComponent = () => {
  const { showToast } = useToast();
  return (
    <div>
      <Button
        onClick={() =>
          showToast({
            type: "success",
            message: "Success Toast",
            duration: 3000,
          })
        }
      >
        Show Success
      </Button>
      <Button
        onClick={() => showToast({ type: "error", message: "Error Toast" })}
      >
        Show Error
      </Button>
      <Button
        onClick={() => {
          showToast({ type: "info", message: "Toast 1", duration: 1000 });
          showToast({ type: "info", message: "Toast 2", duration: 1000 });
          showToast({ type: "info", message: "Toast 3", duration: 1000 });
          showToast({ type: "info", message: "Toast 4", duration: 1000 });
        }}
      >
        Show Many
      </Button>
    </div>
  );
};

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows toast when showToast is called", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Success"));

    expect(screen.getByText("Success Toast")).toBeInTheDocument();
    // Success toast has specific classes (checking color indirectly via text class if possible, or just presence)
    // implementation details: bg-emerald-50
    // screen.getByText('Success Toast') returns the Text component inside.
    // The container is parent's parent usually.
    // For simplicity, just checking message presence is often enough for integration test
  });

  it("removes toast after duration", async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success Toast")).toBeInTheDocument();

    // 3000ms + buffer
    act(() => {
      vi.advanceTimersByTime(3100);
    });

    expect(screen.queryByText("Success Toast")).not.toBeInTheDocument();
  });

  it("keeps error toast (duration=0) until closed", async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Error"));
    expect(screen.getByText("Error Toast")).toBeInTheDocument();

    // Long time passes
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText("Error Toast")).toBeInTheDocument();

    // Close manually
    const closeButtons = screen.getAllByLabelText("通知を閉じる");
    fireEvent.click(closeButtons[0]);

    expect(screen.queryByText("Error Toast")).not.toBeInTheDocument();
  });

  it("limits number of toasts", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText("Show Many"));

    // Should show only 3 toasts (Toast 2, 3, 4) because limit is 3
    expect(screen.queryByText("Toast 1")).not.toBeInTheDocument();
    expect(screen.getByText("Toast 2")).toBeInTheDocument();
    expect(screen.getByText("Toast 3")).toBeInTheDocument();
    expect(screen.getByText("Toast 4")).toBeInTheDocument();
  });

  it("throws error if used outside provider", () => {
    // console.errorを一時的に抑制（Reactのエラーログが出るため）
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      "useToast must be used within a ToastProvider"
    );

    consoleSpy.mockRestore();
  });
});
