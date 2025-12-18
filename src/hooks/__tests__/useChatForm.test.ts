import { renderHook, act } from "@testing-library/react";
import { useChatForm } from "../useChatForm";
import { vi } from "vitest";
import * as navigation from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock useToast
const mockShowToast = vi.fn();
vi.mock("@/components/ui/ToastProvider", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock useSpeechRecognition
vi.mock("@/hooks/useSpeechRecognition", () => ({
  useSpeechRecognition: () => ({
    isRecording: false,
    transcript: "",
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    isSupported: true,
  }),
}));

describe("useChatForm", () => {
  const mockGenerate = vi.fn();
  const mockStop = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (navigation.useRouter as any).mockReturnValue({ replace: mockReplace });
  });

  it("initializes state correctly", () => {
    const { result } = renderHook(() => 
      useChatForm("session-1", mockGenerate, mockStop, false)
    );

    expect(result.current.input).toBe("");
    expect(result.current.isExpanded).toBe(false);
  });

  it("updates input", () => {
    const { result } = renderHook(() => 
      useChatForm("session-1", mockGenerate, mockStop, false)
    );

    act(() => {
      result.current.setInput("hello");
    });
    expect(result.current.input).toBe("hello");
  });

  it("calls generate on doSend with valid input", async () => {
    const { result } = renderHook(() => 
      useChatForm("session-1", mockGenerate, mockStop, false)
    );

    act(() => {
      result.current.setInput("hello");
    });

    await act(async () => {
      await result.current.doSend();
    });

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ query: "hello", sessionId: "session-1" }),
      expect.any(Object)
    );
    expect(result.current.input).toBe(""); // should reset
  });

  it("does not send empty input", async () => {
    const { result } = renderHook(() => 
      useChatForm("session-1", mockGenerate, mockStop, false)
    );

    await act(async () => {
      await result.current.doSend();
    });

    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("creates new session if sessionId is undefined", async () => {
    // Mock crypto.randomUUID
    const mockUUID = "new-uuid";
    vi.stubGlobal("crypto", { randomUUID: () => mockUUID });

    const { result } = renderHook(() => 
      useChatForm(undefined, mockGenerate, mockStop, false)
    );

    act(() => {
      result.current.setInput("hello");
    });

    await act(async () => {
      await result.current.doSend();
    });

    expect(mockReplace).toHaveBeenCalledWith(`/chat?sessionId=${mockUUID}`);
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: mockUUID }),
      expect.any(Object)
    );
  });
});

