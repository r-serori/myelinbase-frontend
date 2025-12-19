export type SessionSummary = {
  sessionId: string;
  sessionName: string;
  createdAt: string;
  lastMessageAt: string;
};

export type ChatMessage = {
  historyId: string;
  createdAt: string;
  userQuery: string;
  aiResponse: string;
  feedback: "GOOD" | "BAD" | "NONE";
};

export type SessionMessagesResponse = {
  items: ChatMessage[];
  nextToken?: string;
};

export type DocumentItem = {
  documentId: string;
  fileName: string;
  status: string;
  createdAt: string;
  s3Path?: string;
  tags?: string[];
  tagSuggestions?: { tag: string; confidence: number }[];
  tagStatus?: "PENDING" | "COMPLETED" | "ERROR";
  tagUpdatedAt?: string;
};
