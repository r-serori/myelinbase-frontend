import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChatForm } from "../useChatForm";

// Mock useToast
const mockShowToast = vi.fn();
vi.mock("@/providers/ToastProvider", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock useSpeechRecognition
vi.mock("@/features/chat/hooks/useSpeechRecognition", () => ({
  useSpeechRecognition: () => ({
    isRecording: false,
    transcript: "",
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    isSupported: true,
  }),
}));

describe("useChatForm", () => {
  const mockOnSubmit = vi.fn();
  const mockStop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes state correctly", () => {
    const { result } = renderHook(() => {
      const [input, setInput] = ["", vi.fn()];
      return useChatForm(
        "session-1",
        input,
        setInput,
        mockOnSubmit,
        false,
        mockStop
      );
    });

    expect(result.current.isExpanded).toBe(false);
  });

  it("updates input", () => {
    const setInput = vi.fn();
    const { result } = renderHook(() => {
      const [input, setInputState] = ["", setInput];
      return useChatForm(
        "session-1",
        input,
        setInputState,
        mockOnSubmit,
        false,
        mockStop
      );
    });

    act(() => {
      result.current.setInput("hello");
    });
    expect(setInput).toHaveBeenCalledWith("hello");
  });

  it("calls generate on doSend with valid input", async () => {
    const setInput = vi.fn();
    const { result } = renderHook(() => {
      const [input, setInputState] = ["hello", setInput];
      return useChatForm(
        "session-1",
        input,
        setInputState,
        mockOnSubmit,
        false,
        mockStop
      );
    });

    await act(async () => {
      await result.current.doSend();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      body: { sessionId: "session-1" },
      query: "hello",
    });
  });

  it("does not send empty input", async () => {
    const setInput = vi.fn();
    const { result } = renderHook(() => {
      const [input, setInputState] = ["", setInput];
      return useChatForm(
        "session-1",
        input,
        setInputState,
        mockOnSubmit,
        false,
        mockStop
      );
    });

    await act(async () => {
      await result.current.doSend();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("creates new session if sessionId is undefined", async () => {
    // Mock crypto.randomUUID
    const mockUUID = "new-uuid";
    vi.stubGlobal("crypto", { randomUUID: () => mockUUID });

    const setInput = vi.fn();
    const { result } = renderHook(() => {
      const [input, setInputState] = ["hello", setInput];
      return useChatForm(
        undefined,
        input,
        setInputState,
        mockOnSubmit,
        false,
        mockStop
      );
    });

    await act(async () => {
      await result.current.doSend();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      body: { sessionId: mockUUID },
      query: "hello",
    });
  });
});
