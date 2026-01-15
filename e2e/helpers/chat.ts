/**
 * チャットテスト用のヘルパー関数
 *
 * テストで使用する共通のユーティリティ関数を提供します。
 */

import { type Page } from "@playwright/test";

/**
 * チャットAPIレスポンスをモックするヘルパー
 */
export async function mockChatApiResponse(
  page: Page,
  response: MockChatResponse
): Promise<void> {
  await page.route("**/chat/stream**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: createSSEResponse(response),
    });
  });
}

/**
 * チャットAPIエラーレスポンスをモックするヘルパー
 */
export async function mockChatApiError(
  page: Page,
  statusCode: number = 500,
  message: string = "Internal Server Error"
): Promise<void> {
  await page.route("**/chat/stream**", (route) => {
    route.fulfill({
      status: statusCode,
      contentType: "application/json",
      body: JSON.stringify({ error: message }),
    });
  });
}

/**
 * セッションAPIレスポンスをモックするヘルパー
 */
export async function mockSessionsApiResponse(
  page: Page,
  sessions: MockSession[]
): Promise<void> {
  await page.route("**/api/sessions**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sessions }),
    });
  });
}

/**
 * セッションメッセージAPIレスポンスをモックするヘルパー
 */
export async function mockSessionMessagesApiResponse(
  page: Page,
  sessionId: string,
  messages: MockMessage[]
): Promise<void> {
  await page.route(`**/api/sessions/${sessionId}/messages**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sessionId, messages }),
    });
  });
}

/**
 * モックセッションの型定義
 */
export interface MockSession {
  sessionId: string;
  sessionName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * モックメッセージの型定義
 */
export interface MockMessage {
  historyId: string;
  userQuery: string;
  aiResponse: string;
  createdAt: string;
  sourceDocuments: MockSourceDocument[];
  feedback: "NONE" | "GOOD" | "BAD";
}

/**
 * モックソースドキュメントの型定義
 */
export interface MockSourceDocument {
  documentId: string;
  fileName: string;
  text: string;
  score: number;
}

/**
 * モックチャットレスポンスの型定義
 */
export interface MockChatResponse {
  historyId: string;
  sessionId: string;
  aiResponse: string;
  sourceDocuments?: MockSourceDocument[];
}

/**
 * モックセッションを生成するヘルパー
 */
export function createMockSession(
  overrides: Partial<MockSession> = {}
): MockSession {
  const now = new Date().toISOString();
  return {
    sessionId: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    sessionName: "テストセッション",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * 複数のモックセッションを生成するヘルパー
 */
export function createMockSessions(
  count: number,
  baseOverrides: Partial<MockSession> = {}
): MockSession[] {
  return Array.from({ length: count }, (_, index) =>
    createMockSession({
      ...baseOverrides,
      sessionId: `session-${index + 1}`,
      sessionName: `セッション ${index + 1}`,
    })
  );
}

/**
 * モックメッセージを生成するヘルパー
 */
export function createMockMessage(
  overrides: Partial<MockMessage> = {}
): MockMessage {
  const now = new Date().toISOString();
  return {
    historyId: `history-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    userQuery: "テスト質問",
    aiResponse: "テスト回答",
    createdAt: now,
    sourceDocuments: [],
    feedback: "NONE",
    ...overrides,
  };
}

/**
 * 複数のモックメッセージを生成するヘルパー
 */
export function createMockMessages(
  count: number,
  baseOverrides: Partial<MockMessage> = {}
): MockMessage[] {
  return Array.from({ length: count }, (_, index) =>
    createMockMessage({
      ...baseOverrides,
      historyId: `history-${index + 1}`,
      userQuery: `質問 ${index + 1}`,
      aiResponse: `回答 ${index + 1}`,
    })
  );
}

/**
 * SSEレスポンスを生成するヘルパー
 */
function createSSEResponse(response: MockChatResponse): string {
  const events: string[] = [];

  // ストリーミングデータをシミュレート
  const words = response.aiResponse.split(" ");
  for (const word of words) {
    events.push(`data: {"type":"text","text":"${word} "}\n\n`);
  }

  // 完了イベント
  events.push(
    `data: {"type":"session_info","sessionId":"${response.sessionId}","historyId":"${response.historyId}"}\n\n`
  );

  // 引用情報があれば追加
  if (response.sourceDocuments && response.sourceDocuments.length > 0) {
    events.push(
      `data: {"type":"citations","citations":${JSON.stringify(response.sourceDocuments)}}\n\n`
    );
  }

  events.push(`data: [DONE]\n\n`);

  return events.join("");
}

/**
 * ストリーミングレスポンスを待機するヘルパー
 */
export async function waitForStreamingResponse(
  page: Page,
  timeout: number = 30000
): Promise<void> {
  // ストリーミングが開始されるまで待機
  await page
    .waitForSelector('[aria-label="生成を停止"]', {
      state: "visible",
      timeout: 5000,
    })
    .catch(() => {
      // ストリーミングが既に完了している場合は無視
    });

  // ストリーミングが完了するまで待機
  await page.waitForSelector('[aria-label="送信"], [aria-label="音声入力"]', {
    state: "visible",
    timeout,
  });
}

/**
 * チャットメッセージが表示されるまで待機するヘルパー
 */
export async function waitForChatMessage(
  page: Page,
  messageText: string,
  timeout: number = 30000
): Promise<void> {
  await page.waitForSelector(`text="${messageText}"`, {
    state: "visible",
    timeout,
  });
}

/**
 * セッションリストが読み込まれるまで待機するヘルパー
 */
export async function waitForSessionListLoad(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  await page
    .waitForResponse(
      (response) =>
        response.url().includes("/api/sessions") && response.status() === 200,
      { timeout }
    )
    .catch(() => {
      // セッションが存在しない場合は無視
    });
}

/**
 * トーストが消えるまで待機するヘルパー
 */
export async function waitForToastToDisappear(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  const toast = page.getByRole("alert").first();
  try {
    await toast.waitFor({ state: "hidden", timeout });
  } catch {
    // トーストが表示されていない場合は無視
  }
}

/**
 * 入力欄がクリアされるまで待機するヘルパー
 */
export async function waitForInputClear(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  const input = page.getByPlaceholder("質問を入力してください");
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const value = await input.inputValue();
    if (value === "") {
      return;
    }
    await page.waitForTimeout(100);
  }
}

/**
 * ネットワークリクエストを待機するヘルパー
 */
export async function waitForChatRequest(page: Page): Promise<void> {
  await page.waitForResponse((response) =>
    response.url().includes("/chat/stream")
  );
}

/**
 * セッションメニューを開くヘルパー
 */
export async function openSessionMenu(
  page: Page,
  sessionId: string
): Promise<void> {
  const sessionLink = page.locator(`#session-link-${sessionId}`);
  const menuButton = sessionLink.locator("..").locator("button");
  await menuButton.click();
}

/**
 * セッション名を取得するヘルパー
 */
export async function getSessionNames(page: Page): Promise<string[]> {
  const sessionLinks = page.locator('a[href*="/chat?sessionId="]');
  const count = await sessionLinks.count();
  const names: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await sessionLinks.nth(i).textContent();
    if (text) {
      names.push(text.trim());
    }
  }

  return names;
}
