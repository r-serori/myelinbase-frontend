import * as navigation from "next/navigation";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChatForm } from "@/features/chat/hooks/useChatForm";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock useToast
const mockShowToast = vi.fn();
vi.mock("@/providers/ToastProvider", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock useSpeechRecognition
vi.mock("@/features/chat/hooks/useSpeechRecognition", () => ({
  useSpeechRecognition: () => ({
    isRecording: false,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    isSupported: true,
  }),
}));

describe("useChatForm", () => {
  const mockOnSubmit = vi.fn();
  const mockStop = vi.fn();
  const mockReplace = vi.fn();
  const mockSetInput = vi.fn(); // 外部注入されるsetInput

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(navigation.useRouter).mockReturnValue({
      replace: mockReplace,
    } as ReturnType<typeof navigation.useRouter>);
  });

  it("calls onSubmit on doSend with valid input", async () => {
    const { result } = renderHook(() =>
      useChatForm(
        "session-1",
        "hello", // input
        mockSetInput,
        mockOnSubmit,
        false, // isStreaming
        mockStop
      )
    );

    await act(async () => {
      await result.current.doSend();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "hello",
        body: expect.objectContaining({ sessionId: "session-1" }),
      })
    );
    // 成功時はresetFormが呼ばれる -> setInput("")が呼ばれる
    expect(mockSetInput).toHaveBeenCalledWith("");
  });

  it("does not send empty input (validation check inside doSend)", async () => {
    // 空文字の場合はZodバリデーションでエラーになる
    const { result } = renderHook(() =>
      useChatForm(
        "session-1",
        "   ", // empty after trim
        mockSetInput,
        mockOnSubmit,
        false,
        mockStop
      )
    );

    await act(async () => {
      try {
        await result.current.doSend();
      } catch {
        // エラーは期待通り
      }
    });

    // バリデーションエラーになり、onSubmitは呼ばれないはず
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    );
  });

  it("creates new session if sessionId is undefined", async () => {
    const mockUUID = "new-uuid";
    vi.stubGlobal("crypto", { randomUUID: () => mockUUID });
    const mockOnNewSessionCreated = vi.fn();

    const { result } = renderHook(() =>
      useChatForm(
        undefined,
        "hello",
        mockSetInput,
        mockOnSubmit,
        false,
        mockStop,
        mockOnNewSessionCreated
      )
    );

    await act(async () => {
      await result.current.doSend();
    });

    expect(mockOnNewSessionCreated).toHaveBeenCalledWith(mockUUID);
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ sessionId: mockUUID }),
      })
    );
  });

  it("calls stop if streaming when sending", async () => {
    const { result } = renderHook(() =>
      useChatForm(
        "session-1",
        "stop and send",
        mockSetInput,
        mockOnSubmit,
        true, // isStreaming
        mockStop
      )
    );

    await act(async () => {
      await result.current.doSend();
    });

    expect(mockStop).toHaveBeenCalled();
    expect(mockOnSubmit).toHaveBeenCalled();
  });
});
