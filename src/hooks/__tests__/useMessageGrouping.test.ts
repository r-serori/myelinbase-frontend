import { renderHook, act } from "@testing-library/react";
import { useMessageGrouping } from "../useMessageGrouping";
import { MessageSummary } from "@/lib/schemas/chat";

describe("useMessageGrouping", () => {
  const mockMessages: MessageSummary[] = [
    {
      messageId: "1-v1",
      historyId: "1",
      role: "user",
      content: "Hello V1",
      createdAt: "2023-01-01T10:00:00Z",
      model: "gpt-4",
    },
    {
      messageId: "1-v2",
      historyId: "1",
      role: "user",
      content: "Hello V2",
      createdAt: "2023-01-01T10:05:00Z",
      model: "gpt-4",
    },
    {
      messageId: "2",
      historyId: "2",
      role: "assistant",
      content: "Hi there",
      createdAt: "2023-01-01T10:06:00Z",
      model: "gpt-4",
    },
  ];

  it("groups messages by historyId and selects latest version by default", () => {
    const { result } = renderHook(() => useMessageGrouping(mockMessages));

    expect(result.current.displayItems).toHaveLength(2);
    // Should show V2 for historyId 1 (latest)
    expect(result.current.displayItems[0].content).toBe("Hello V2");
    expect(result.current.displayItems[0].versionInfo.current).toBe(2);
    expect(result.current.displayItems[0].versionInfo.total).toBe(2);

    expect(result.current.displayItems[1].content).toBe("Hi there");
  });

  it("allows switching versions", () => {
    const { result } = renderHook(() => useMessageGrouping(mockMessages));
    
    // Switch first item to previous version
    act(() => {
      result.current.displayItems[0].versionInfo.onPrev();
    });

    expect(result.current.displayItems[0].content).toBe("Hello V1");
    expect(result.current.displayItems[0].versionInfo.current).toBe(1);

    // Switch back to next version
    act(() => {
        result.current.displayItems[0].versionInfo.onNext();
    });

    expect(result.current.displayItems[0].content).toBe("Hello V2");
  });
});

