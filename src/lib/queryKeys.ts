export const queryKeys = {
  sessions: ["sessions"] as const,
  sessionMessages: (id: string) => ["sessionMessages", id] as const,
  documents: ["documents"] as const,
  documentStatus: (id: string) => ["documentStatus", id] as const,
};
