export type StreamCallbacks = {
  onText: (text: string) => void;
  onSessionId: (sessionId: string) => void;
  onDone: (sessionId?: string) => void;
  onError: (error: Error) => void;
};

export async function processChatStream(
  response: Response,
  callbacks: StreamCallbacks
) {
  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          let data;
          try {
            data = JSON.parse(jsonStr);
          } catch (e) {
            console.error("JSON parse error", e);
            continue;
          }

          if (data.type === "text" || data.chunk) {
            callbacks.onText(data.text || data.chunk);
          } else if (data.type === "session_id") {
            callbacks.onSessionId(data.sessionId);
          } else if (data.type === "done" || data.done) {
            callbacks.onDone(data.sessionId);
          } else if (data.type === "error" || data.error) {
            throw new Error(data.message || "Stream error");
          }
        }
      }
    }
  } catch (error) {
    callbacks.onError(error as Error);
  } finally {
    reader.releaseLock();
  }
}
