// Mock API layer for local development without backend or external services

import { mockChatMessagesBySession, mockChatSessions } from "./mockData/chat";

type MockSession = {
  sessionId: string;
  sessionName: string;
  createdAt: string;
  lastMessageAt: string;
};

type MockMessage = {
  historyId: string;
  createdAt: string;
  userQuery: string;
  aiResponse: string;
  feedback: "NONE" | "GOOD" | "BAD";
};

function jsonResponse(data: any) {
  return data;
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// 文書モック生成ヘルパ
function buildMockDocument(index: number) {
  const id = `doc-${String(index).padStart(3, "0")}`;
  const baseNames = [
    "社内規定",
    "就業規則",
    "労働基準法_解説",
    "A商品約款",
    "B商品約款",
    "コンプライアンス研修資料",
    "ハラスメント防止マニュアル",
    "情報セキュリティポリシー",
    "人事評価制度_概要",
    "テレワーク規程",
  ];
  const name = baseNames[index % baseNames.length] + ".pdf";
  const statusCycle = ["PENDING", "PROCESSING", "COMPLETED", "ERROR"] as const;
  const status = statusCycle[index % statusCycle.length];
  const createdAt = new Date(Date.now() - index * 60 * 60 * 1000).toISOString();

  const tagSets: string[][] = [
    ["会社規定", "労働基準"],
    ["商品約款"],
    ["コンプライアンス"],
    ["人事制度"],
    ["マニュアル"],
    [],
  ];
  const tags = tagSets[index % tagSets.length];
  const tagStatus = tags.length > 0 ? "COMPLETED" : "PENDING";
  const tagSuggestions =
    tags.length === 0
      ? [
          { tag: "会社規定", confidence: 0.82 },
          { tag: "商品約款", confidence: 0.76 },
        ]
      : [];
  const tagUpdatedAt = createdAt;

  return {
    documentId: id,
    fileName: name,
    status,
    createdAt,
    s3Path: `s3://mock-bucket/docs/${id}.pdf`,
    tags,
    tagStatus,
    tagSuggestions,
    tagUpdatedAt,
  };
}

// ---- Chat 用のインメモリ状態 ----

// 初期データは JSON 相当のモジュールから読み込み、以降はインメモリで更新する
const chatSessions: MockSession[] = mockChatSessions.map((s) => ({ ...s }));

const chatMessagesBySession: Record<string, MockMessage[]> = Object.fromEntries(
  Object.entries(mockChatMessagesBySession).map(([sessionId, msgs]) => [
    sessionId,
    (msgs as any as MockMessage[]).map((m) => ({ ...m })),
  ])
);

function getOrCreateSession(sessionId: string, sessionName?: string) {
  let s = chatSessions.find((x) => x.sessionId === sessionId);
  if (!s) {
    const now = new Date().toISOString();
    s = {
      sessionId,
      sessionName: sessionName || "新しいチャット",
      createdAt: now,
      lastMessageAt: now,
    };
    chatSessions.unshift(s);
  }
  if (!chatMessagesBySession[sessionId]) {
    chatMessagesBySession[sessionId] = [];
  }
  return s;
}

function addChatMessage(sessionId: string, userQuery: string, answer: string) {
  const now = new Date().toISOString();
  const historyId = `hist-${sessionId}-${Date.now()}`;
  const msg: MockMessage = {
    historyId,
    createdAt: now,
    userQuery,
    aiResponse: answer,
    feedback: "NONE",
  };
  if (!chatMessagesBySession[sessionId]) {
    chatMessagesBySession[sessionId] = [];
  }
  chatMessagesBySession[sessionId].push(msg);

  const idx = chatSessions.findIndex((s) => s.sessionId === sessionId);
  if (idx >= 0) {
    chatSessions[idx] = {
      ...chatSessions[idx],
      lastMessageAt: now,
      sessionName: chatSessions[idx].sessionName || userQuery.slice(0, 30),
    };
  }
  return msg;
}

function splitAnswerIntoChunks(text: string): string[] {
  const maxChunkLength = 40;
  const chunks: string[] = [];
  let buffer = "";
  for (const ch of text) {
    buffer += ch;
    const isSentenceBoundary = /[。．.!?！？]/.test(ch);
    if (buffer.length >= maxChunkLength || isSentenceBoundary) {
      chunks.push(buffer);
      buffer = "";
    }
  }
  if (buffer.length > 0) {
    chunks.push(buffer);
  }
  return chunks;
}

export async function mockFetch(path: string, init?: RequestInit) {
  await delay(200); // simulate latency
  const method = (init?.method || "GET").toUpperCase();

  // Chat sessions
  if (path === "/chat/sessions" && method === "GET") {
    const sorted = [...chatSessions].sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
    );
    return jsonResponse({
      sessions: sorted,
    });
  }

  // Chat session messages
  if (path.startsWith("/chat/session/") && method === "GET") {
    const url = new URL(path, "http://localhost");
    const parts = url.pathname.split("/");
    const sessionId = parts[3];
    const order = url.searchParams.get("order") || "desc";

    const items = (chatMessagesBySession[sessionId] || [])
      .slice()
      .sort((a, b) =>
        order === "asc"
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return jsonResponse({
      items,
      nextToken: undefined,
    });
  }

  // Chat search
  if (path === "/chat/search" && method === "POST") {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    const query = body.query as string;
    let sessionId: string = body.sessionId;
    const redoHistoryId: string | undefined = body.redoHistoryId;

    // 新規セッションの場合は新しい sessionId を発行
    if (!sessionId) {
      sessionId = `sess-${Date.now()}`;
      getOrCreateSession(sessionId, query?.slice(0, 30) || "新しいチャット");
    } else {
      getOrCreateSession(sessionId);
    }

    // redo の場合は対象の履歴を削除してから新しいメッセージを追加
    if (redoHistoryId && chatMessagesBySession[sessionId]) {
      chatMessagesBySession[sessionId] = chatMessagesBySession[
        sessionId
      ].filter((m) => m.historyId !== redoHistoryId);
    }

    const answer = redoHistoryId
      ? `（再生成）「${query}」に対するモックの回答です。`
      : `「${query}」に対するモックの回答です。`;
    const msg = addChatMessage(sessionId, query, answer);

    return jsonResponse({
      historyId: msg.historyId,
      sessionId,
      answer: msg.aiResponse,
      sourceDocuments: [
        {
          fileName: "mock.pdf",
          uri: "s3://mock/mock.pdf",
          page: 1,
          score: 0.9,
        },
      ],
    });
  }

  // Chat search (with chunks)
  if (path === "/chat/search/chunks" && method === "POST") {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    const query = body.query as string;
    let sessionId: string = body.sessionId;
    const redoHistoryId: string | undefined = body.redoHistoryId;

    if (!sessionId) {
      sessionId = `sess-${Date.now()}`;
      getOrCreateSession(sessionId, query?.slice(0, 30) || "新しいチャット");
    } else {
      getOrCreateSession(sessionId);
    }

    if (redoHistoryId && chatMessagesBySession[sessionId]) {
      chatMessagesBySession[sessionId] = chatMessagesBySession[
        sessionId
      ].filter((m) => m.historyId !== redoHistoryId);
    }

    const answer = redoHistoryId
      ? `（再生成）「${query}」に対するモックの回答です。`
      : `「${query}」に対するモックの回答です。`;
    const msg = addChatMessage(sessionId, query, answer);
    const answerChunks = splitAnswerIntoChunks(msg.aiResponse);

    return jsonResponse({
      historyId: msg.historyId,
      sessionId,
      answer: msg.aiResponse,
      answerChunks,
      sourceDocuments: [
        {
          fileName: "mock.pdf",
          uri: "s3://mock/mock.pdf",
          page: 1,
          score: 0.9,
        },
      ],
    });
  }

  // Documents list
  if (path.startsWith("/documents") && method === "GET") {
    const url = new URL(path, "http://localhost");
    if (url.pathname !== "/documents") {
      // /documents/:id などは別ハンドラで処理
      // fallthrough
    } else {
      const filenameFilter = url.searchParams.get("filename") || "";
      const tagParam = url.searchParams.get("tag") || "";
      const tagsFilter = tagParam
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const allDocuments = Array.from({ length: 50 }, (_, i) =>
        buildMockDocument(i + 1)
      );
      let docs = allDocuments;

      if (filenameFilter) {
        const lower = filenameFilter.toLowerCase();
        docs = docs.filter((d) => d.fileName.toLowerCase().includes(lower));
      }
      if (tagsFilter.length > 0) {
        docs = docs.filter((d) => {
          const docTags: string[] = Array.isArray(d.tags) ? d.tags : [];
          return tagsFilter.every((tg) =>
            docTags.some((x) => x.toLowerCase() === tg.toLowerCase())
          );
        });
      }

      return jsonResponse({
        documents: docs,
      });
    }
  }

  // Document status
  if (path.startsWith("/documents/") && method === "GET") {
    const url = new URL(path, "http://localhost");
    const parts = url.pathname.split("/");
    const id = parts[2];
    const match = id.match(/^doc-(\d+)$/);
    const doc = match
      ? buildMockDocument(Number(match[1]))
      : {
          documentId: id,
          fileName: `${id}.pdf`,
          status: Math.random() > 0.5 ? "COMPLETED" : "PROCESSING",
          createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          s3Path: `s3://mock-bucket/docs/${id}.pdf`,
        };
    return jsonResponse({
      document: doc,
    });
  }

  // Document upload
  if (path === "/documents/upload" && method === "POST") {
    const body: any = (init as any)?.body;
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      const files = body.getAll("file") as File[];
      if (files && files.length > 1) {
        const results = files.map((f, i) => ({
          documentId: `doc-${Date.now()}-${i}`,
          status: "PENDING",
          message: "Upload accepted. Processing started.",
          fileName: (f && (f as any).name) || `file-${i}`,
        }));
        return jsonResponse({
          success: true,
          results,
        });
      }
    }
    return jsonResponse({
      documentId: `doc-${Date.now()}`,
      status: "PENDING",
      message: "Upload accepted. Processing started.",
    });
  }

  // Document delete
  if (path.startsWith("/documents/") && method === "DELETE") {
    return jsonResponse({
      message: "Delete request accepted.",
    });
  }

  // Fallback
  return jsonResponse({ ok: true });
}
