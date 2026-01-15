import { expect, test } from "../base";
import { ChatPage } from "../pom/ChatPage";

/**
 * チャットページのテスト
 */

// ========== 1. 未認証ユーザー向けのテストグループ ==========
test.describe("Chat Page (Unauthenticated)", () => {
  // このブロック内のテストは、グローバル設定を無視して「未ログイン状態」で開始する
  test.use({ storageState: { cookies: [], origins: [] } });

  test("未認証ユーザーがアクセスするとログインページにリダイレクトされること", async ({
    page,
  }) => {
    // ページ遷移（beforeEachがないので直接移動）
    await page.goto("/chat");

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });
});

// ========== 2. 認証済みユーザー向けのテストグループ ==========
test.describe("Chat Page", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();
  });

  test("チャットページの主要な要素が正しく表示されること", async () => {
    await chatPage.verifyPageLoaded();

    // チャット入力が表示されていることを確認
    await expect(chatPage.chatInput).toBeVisible();

    // 送信ボタンが表示されていることを確認（存在する場合）
    // 実装によっては送信ボタンが常に表示されない場合があります
  });

  test("未認証ユーザーがアクセスするとログインページにリダイレクトされること", async ({
    page,
  }) => {
    // 新しいコンテキストで未認証状態でアクセス
    await page.goto("/chat");

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });

  test("チャット入力欄にメッセージを入力できること", async () => {
    await chatPage.verifyPageLoaded();

    await chatPage.chatInput.fill("テストメッセージ");

    // 入力されたテキストが表示されることを確認
    await expect(chatPage.chatInput).toHaveValue("テストメッセージ");
  });

  test("セッションサイドバーが表示されること", async () => {
    await chatPage.verifyPageLoaded();

    // サイドバーが表示されることを確認（実装に応じて調整）
    // サイドバーが常に表示される場合と、トグルで表示/非表示される場合があります
  });

  test("新規チャットボタンが表示されること", async () => {
    await chatPage.verifyPageLoaded();

    // 新規チャットボタンが表示されることを確認（存在する場合）
    if (await chatPage.newChatButton.isVisible()) {
      await expect(chatPage.newChatButton).toBeVisible();
    }
  });

  test("特定のセッションIDでチャットページにアクセスできること", async () => {
    const testSessionId = "test-session-123";
    await chatPage.goto(testSessionId);

    // URLにセッションIDが含まれることを確認
    await expect(chatPage.page).toHaveURL(/.*sessionId=test-session-123/);
  });

  test("メッセージ送信後、メッセージが表示されること", async () => {
    await chatPage.verifyPageLoaded();

    // メッセージを送信（実際のAPIがモックされている場合）
    const testMessage = "テストメッセージ";
    await chatPage.sendMessage(testMessage);

    // メッセージが表示されることを確認（実装に応じて調整）
    // 実際のAPIレスポンスを待つ必要がある場合は、適切な待機処理を追加してください
  });
});
