/**
 * ドキュメントテスト用のヘルパー関数
 *
 * テストで使用する共通のユーティリティ関数を提供します。
 */

import { type Page } from "@playwright/test";

/**
 * APIレスポンスをモックするヘルパー
 */
export async function mockDocumentsApiResponse(
  page: Page,
  documents: MockDocument[]
): Promise<void> {
  await page.route("**/api/documents", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ documents }),
    });
  });
}

/**
 * APIエラーレスポンスをモックするヘルパー
 */
export async function mockDocumentsApiError(
  page: Page,
  statusCode: number = 500,
  message: string = "Internal Server Error"
): Promise<void> {
  await page.route("**/api/documents", (route) => {
    route.fulfill({
      status: statusCode,
      contentType: "application/json",
      body: JSON.stringify({ error: message }),
    });
  });
}

/**
 * APIレスポンスの遅延をモックするヘルパー
 */
export async function mockDocumentsApiDelay(
  page: Page,
  delayMs: number = 3000
): Promise<void> {
  await page.route("**/api/documents", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ documents: [] }),
    });
  });
}

/**
 * モックドキュメントの型定義
 */
export interface MockDocument {
  documentId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  status: "COMPLETED" | "PROCESSING" | "ERROR" | "PENDING_UPLOAD";
  tags: string[];
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

/**
 * モックドキュメントを生成するヘルパー
 */
export function createMockDocument(
  overrides: Partial<MockDocument> = {}
): MockDocument {
  const now = new Date().toISOString();
  return {
    documentId: `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    fileName: "test-document.pdf",
    contentType: "application/pdf",
    fileSize: 1024,
    status: "COMPLETED",
    tags: [],
    createdAt: now,
    updatedAt: now,
    ownerId: "test-user",
    ...overrides,
  };
}

/**
 * 複数のモックドキュメントを生成するヘルパー
 */
export function createMockDocuments(
  count: number,
  baseOverrides: Partial<MockDocument> = {}
): MockDocument[] {
  return Array.from({ length: count }, (_, index) =>
    createMockDocument({
      ...baseOverrides,
      documentId: `doc-${index + 1}`,
      fileName: `document-${index + 1}.pdf`,
    })
  );
}

/**
 * ファイルアップロードをシミュレートするヘルパー
 * 注意: Playwrightのファイルチューザーを使用
 */
export async function simulateFileUpload(
  page: Page,
  filePath: string,
  inputSelector: string = 'input[type="file"]'
): Promise<void> {
  const fileInput = page.locator(inputSelector);
  await fileInput.setInputFiles(filePath);
}

/**
 * ネットワークリクエストを待機するヘルパー
 */
export async function waitForDocumentsRequest(page: Page): Promise<void> {
  await page.waitForResponse((response) =>
    response.url().includes("/api/documents")
  );
}

/**
 * テーブル行の数を取得するヘルパー
 */
export async function getTableRowCount(page: Page): Promise<number> {
  const rows = page.locator("tbody tr");
  return await rows.count();
}

/**
 * 特定のステータスのドキュメント行を取得するヘルパー
 */
export function getDocumentsByStatus(
  page: Page,
  status: "完了" | "処理中" | "エラー" | "保留中"
) {
  return page.locator("tbody tr").filter({ hasText: status });
}

/**
 * ページネーション情報をパースするヘルパー
 */
export async function parsePaginationInfo(
  page: Page
): Promise<{ current: number; total: number; showing: string } | null> {
  const paginationText = await page.getByText(/\d+\s*\/\s*\d+/).textContent();
  if (!paginationText) return null;

  const pageMatch = paginationText.match(/(\d+)\s*\/\s*(\d+)/);
  const showingMatch = await page.getByText(/件中.*件を表示/).textContent();

  return {
    current: pageMatch ? parseInt(pageMatch[1], 10) : 1,
    total: pageMatch ? parseInt(pageMatch[2], 10) : 1,
    showing: showingMatch || "",
  };
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
 * モーダルが完全に閉じるまで待機するヘルパー
 */
export async function waitForModalToClose(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  const modal = page.getByRole("dialog");
  try {
    await modal.waitFor({ state: "hidden", timeout });
  } catch {
    // モーダルが表示されていない場合は無視
  }
}

/**
 * ドキュメントのステータス変更を待機するヘルパー
 */
export async function waitForDocumentStatusChange(
  page: Page,
  documentId: string,
  expectedStatus: string,
  timeout: number = 30000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const row = page.locator(`tr:has-text("${documentId}")`);
    const statusText = await row.locator('[class*="status"]').textContent();

    if (statusText?.includes(expectedStatus)) {
      return;
    }

    await page.waitForTimeout(1000);
  }

  throw new Error(
    `Document ${documentId} did not reach status ${expectedStatus} within ${timeout}ms`
  );
}
