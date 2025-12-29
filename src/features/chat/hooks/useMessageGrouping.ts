import { useMemo, useState } from "react";

import { MessageSummary } from "@/lib/api/generated/model";

export function useMessageGrouping(messages: MessageSummary[]) {
  const [selectedVersions, setSelectedVersions] = useState<
    Record<string, number>
  >({});

  const displayItems = useMemo(() => {
    const groupedMessages = new Map<string, MessageSummary[]>();
    const historyOrder: string[] = [];
    const seenHistoryIds = new Set<string>();

    messages.forEach((m) => {
      if (!groupedMessages.has(m.historyId)) {
        groupedMessages.set(m.historyId, []);
      }
      groupedMessages.get(m.historyId)?.push(m);

      if (!seenHistoryIds.has(m.historyId)) {
        historyOrder.push(m.historyId);
        seenHistoryIds.add(m.historyId);
      }
    });

    groupedMessages.forEach((group) => {
      group.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });

    return historyOrder.map((historyId) => {
      const group = groupedMessages.get(historyId)!;
      const totalVersions = group.length;

      const selectedIndex =
        selectedVersions[historyId] !== undefined
          ? selectedVersions[historyId]
          : totalVersions - 1;

      const safeIndex = Math.max(0, Math.min(selectedIndex, totalVersions - 1));
      const message = group[safeIndex];

      return {
        ...message,
        versionInfo: {
          current: safeIndex + 1,
          total: totalVersions,
          onPrev: () =>
            setSelectedVersions((prev) => ({
              ...prev,
              [historyId]: safeIndex - 1,
            })),
          onNext: () =>
            setSelectedVersions((prev) => ({
              ...prev,
              [historyId]: safeIndex + 1,
            })),
        },
      };
    });
  }, [messages, selectedVersions]);

  return { displayItems };
}
