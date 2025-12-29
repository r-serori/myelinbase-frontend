import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useMessageGrouping } from "@/features/chat/hooks/useMessageGrouping";
import { FeedbackType, MessageSummary } from "@/lib/api/generated/model";

describe("useMessageGrouping", () => {
  const mockMessages: MessageSummary[] = [
    {
      historyId: "1",
      userQuery: "Hello V1",
      aiResponse: "Hello V1",
      sourceDocuments: [],
      feedback: FeedbackType.GOOD,
      createdAt: "2023-01-01T10:00:00Z",
    },
    {
      historyId: "1",
      userQuery: "Hello V2",
      aiResponse: "Hello V2",
      sourceDocuments: [],
      feedback: FeedbackType.GOOD,
      createdAt: "2023-01-01T10:05:00Z",
    },
    {
      historyId: "2",
      userQuery: "Hi there",
      aiResponse: "Hi there",
      sourceDocuments: [],
      feedback: FeedbackType.GOOD,
      createdAt: "2023-01-01T10:06:00Z",
    },
  ];

  it("groups messages by historyId and selects latest version by default", () => {
    const { result } = renderHook(() => useMessageGrouping(mockMessages));

    expect(result.current.displayItems).toHaveLength(2);
    // Should show V2 for historyId 1 (latest)
    // displayItemsにはuserQueryとaiResponseが含まれる
    expect(result.current.displayItems[0].userQuery).toBe("Hello V2");
    expect(result.current.displayItems[0].aiResponse).toBe("Hello V2");
    expect(result.current.displayItems[0].versionInfo.current).toBe(2);
    expect(result.current.displayItems[0].versionInfo.total).toBe(2);

    expect(result.current.displayItems[1].userQuery).toBe("Hi there");
    expect(result.current.displayItems[1].aiResponse).toBe("Hi there");
  });

  it("allows switching versions", () => {
    const { result } = renderHook(() => useMessageGrouping(mockMessages));

    // Switch first item to previous version
    act(() => {
      result.current.displayItems[0].versionInfo.onPrev();
    });

    expect(result.current.displayItems[0].userQuery).toBe("Hello V1");
    expect(result.current.displayItems[0].aiResponse).toBe("Hello V1");
    expect(result.current.displayItems[0].versionInfo.current).toBe(1);

    // Switch back to next version
    act(() => {
      result.current.displayItems[0].versionInfo.onNext();
    });

    expect(result.current.displayItems[0].userQuery).toBe("Hello V2");
    expect(result.current.displayItems[0].aiResponse).toBe("Hello V2");
  });
});
