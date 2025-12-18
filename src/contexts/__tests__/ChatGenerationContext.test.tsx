import { render, screen, waitFor, act } from "@testing-library/react";
import { ChatGenerationProvider, useChatGenerationContext } from "../ChatGenerationContext";
import { vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as AuthLib from "@/lib/auth";
import * as StreamUtils from "@/lib/stream-utils";

// Setup QueryClient
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getJwt: vi.fn(),
}));

vi.mock("@/lib/stream-utils", () => ({
  processChatStream: vi.fn(),
}));

// Test Component
const TestComponent = ({ sessionId }: { sessionId: string }) => {
  const { startGeneration, isGenerating, getGenerationState, abortGeneration } = useChatGenerationContext();
  const state = getGenerationState(sessionId);

  return (
    <div>
      <div data-testid="is-generating">{isGenerating(sessionId).toString()}</div>
      <div data-testid="streaming-text">{state.streamingText}</div>
      <div data-testid="error">{state.error}</div>
      <button onClick={() => startGeneration({ query: "test query", sessionId })}>Start</button>
      <button onClick={() => abortGeneration(sessionId)}>Abort</button>
    </div>
  );
};

describe("ChatGenerationContext", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    global.fetch = vi.fn();
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:3000";
  });

  it("starts generation and updates state", async () => {
    (AuthLib.getJwt as any).mockResolvedValue("mock-token");
    (global.fetch as any).mockResolvedValue({
      ok: true,
      body: "stream",
    });

    let resolveStream: ((value: void | PromiseLike<void>) => void) | null = null;
    const streamPromise = new Promise<void>(r => { resolveStream = r; });

    // Mock processChatStream to simulate streaming
    (StreamUtils.processChatStream as any).mockImplementation(async (_res, callbacks) => {
      callbacks.onText("Hello");
      await new Promise(r => setTimeout(r, 10));
      callbacks.onText(" World");
      if (resolveStream) await streamPromise;
      callbacks.onDone("session-1");
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ChatGenerationProvider>
          <TestComponent sessionId="session-1" />
        </ChatGenerationProvider>
      </QueryClientProvider>
    );

    const startButton = screen.getByText("Start");
    await act(async () => {
      startButton.click();
    });

    expect(screen.getByTestId("is-generating")).toHaveTextContent("true");
    
    // Check fetch call
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/chat/stream",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ query: "test query", sessionId: "session-1" }),
      })
    );

    // Wait for stream processing (intermediate state)
    await waitFor(() => {
        expect(screen.getByTestId("streaming-text")).toHaveTextContent("Hello World");
    });
    
    // Finish stream
    await act(async () => {
        if (resolveStream) resolveStream();
    });

    // After onDone, it updates state and clears text
    await waitFor(() => {
      expect(screen.getByTestId("is-generating")).toHaveTextContent("false");
      expect(screen.getByTestId("streaming-text")).toHaveTextContent("");
    });
  });

  it("handles fetch error", async () => {
    (AuthLib.getJwt as any).mockResolvedValue("mock-token");
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ChatGenerationProvider>
          <TestComponent sessionId="session-1" />
        </ChatGenerationProvider>
      </QueryClientProvider>
    );

    const startButton = screen.getByText("Start");
    await act(async () => {
      startButton.click();
    });

    await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Search failed: 500");
        expect(screen.getByTestId("is-generating")).toHaveTextContent("false");
    });
  });

  it("aborts generation", async () => {
     (AuthLib.getJwt as any).mockResolvedValue("mock-token");
     // Mock fetch to return a pending promise or stream
     const abortController = new AbortController();
     (global.fetch as any).mockReturnValue(new Promise(() => {})); // Never resolves to simulate pending

    render(
      <QueryClientProvider client={queryClient}>
        <ChatGenerationProvider>
          <TestComponent sessionId="session-1" />
        </ChatGenerationProvider>
      </QueryClientProvider>
    );

    await act(async () => {
      screen.getByText("Start").click();
    });

    expect(screen.getByTestId("is-generating")).toHaveTextContent("true");

    await act(async () => {
      screen.getByText("Abort").click();
    });

    expect(screen.getByTestId("is-generating")).toHaveTextContent("false");
  });
});

