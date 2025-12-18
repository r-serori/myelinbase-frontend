import { processChatStream, StreamCallbacks } from "../stream-utils";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("processChatStream", () => {
  const mockCallbacks: StreamCallbacks = {
    onText: vi.fn(),
    onSessionId: vi.fn(),
    onDone: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create a readable stream from string chunks
  const createStreamResponse = (chunks: string[]) => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    });
    return new Response(stream);
  };

  it("throws error if response body is null", async () => {
    const response = { body: null } as Response;
    await expect(processChatStream(response, mockCallbacks)).rejects.toThrow(
      "No response body"
    );
  });

  it("processes text chunks correctly", async () => {
    const data1 = JSON.stringify({ type: "text", text: "Hello" });
    const data2 = JSON.stringify({ type: "text", text: " World" });
    const streamData = [`data: ${data1}\n\n`, `data: ${data2}\n\n`];

    const response = createStreamResponse(streamData);
    await processChatStream(response, mockCallbacks);

    expect(mockCallbacks.onText).toHaveBeenNthCalledWith(1, "Hello");
    expect(mockCallbacks.onText).toHaveBeenNthCalledWith(2, " World");
  });

  it("processes session_id event", async () => {
    const data = JSON.stringify({ type: "session_id", sessionId: "sess-123" });
    const streamData = [`data: ${data}\n\n`];

    const response = createStreamResponse(streamData);
    await processChatStream(response, mockCallbacks);

    expect(mockCallbacks.onSessionId).toHaveBeenCalledWith("sess-123");
  });

  it("processes done event", async () => {
    const data = JSON.stringify({ type: "done", sessionId: "sess-123" });
    const streamData = [`data: ${data}\n\n`];

    const response = createStreamResponse(streamData);
    await processChatStream(response, mockCallbacks);

    expect(mockCallbacks.onDone).toHaveBeenCalledWith("sess-123");
  });

  it("processes error event", async () => {
    const data = JSON.stringify({
      type: "error",
      message: "Something went wrong",
    });
    const streamData = [`data: ${data}\n\n`];

    const response = createStreamResponse(streamData);
    await processChatStream(response, mockCallbacks);

    expect(mockCallbacks.onError).toHaveBeenCalledWith(expect.any(Error));
    // The exact error object is passed, check message
    const errorCall = (mockCallbacks.onError as any).mock.calls[0][0];
    expect(errorCall.message).toBe("Something went wrong");
  });

  it("handles split chunks", async () => {
    // Simulate a JSON split across two chunks
    const fullJson = JSON.stringify({ type: "text", text: "Split" });
    const part1 = `data: ${fullJson.slice(0, 10)}`;
    const part2 = `${fullJson.slice(10)}\n\n`;

    const response = createStreamResponse([part1, part2]);
    await processChatStream(response, mockCallbacks);

    expect(mockCallbacks.onText).toHaveBeenCalledWith("Split");
  });

  it("handles multiple lines in one chunk", async () => {
    const data1 = JSON.stringify({ type: "text", text: "A" });
    const data2 = JSON.stringify({ type: "text", text: "B" });
    const chunk = `data: ${data1}\n\ndata: ${data2}\n\n`;

    const response = createStreamResponse([chunk]);
    await processChatStream(response, mockCallbacks);

    expect(mockCallbacks.onText).toHaveBeenCalledTimes(2);
    expect(mockCallbacks.onText).toHaveBeenCalledWith("A");
    expect(mockCallbacks.onText).toHaveBeenCalledWith("B");
  });
});
