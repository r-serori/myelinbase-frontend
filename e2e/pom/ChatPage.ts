import { expect, type Locator, Page } from "@playwright/test";

/**
 * ChatPage のページオブジェクト
 * チャット画面の要素と操作をカプセル化します。
 */
export class ChatPage {
  readonly page: Page;

  // 主要な要素
  readonly sessionSidebar: Locator;
  readonly newChatButton: Locator;
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly messagesContainer: Locator;
  readonly documentPreviewSidebar: Locator;
  readonly sidebarToggleButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // セレクタの定義
    // src/app/chat/page.tsx の実装に基づいています

    // セッションサイドバー
    this.sessionSidebar = page
      .getByRole("complementary")
      .or(page.getByRole("region", { name: /セッション|session/i }))
      .first();

    // 新規チャットボタン
    this.newChatButton = page.getByRole("button", {
      name: /新規チャット|New Chat/i,
    });

    // チャット入力
    this.chatInput = page
      .getByPlaceholder(/メッセージを入力|メッセージ/i)
      .first();

    // 送信ボタン
    this.sendButton = page
      .getByRole("button", { name: /送信|Send/i })
      .or(
        page
          .getByRole("button", { name: "" })
          .filter({ has: page.getByRole("button") })
      )
      .first();

    // メッセージコンテナ
    this.messagesContainer = page
      .getByRole("main")
      .or(page.getByRole("region", { name: /メッセージ|messages/i }));

    // ドキュメントプレビューサイドバー
    this.documentPreviewSidebar = page
      .getByRole("complementary")
      .filter({ hasText: /プレビュー|preview/i })
      .first();

    // サイドバートグルボタン
    this.sidebarToggleButton = page
      .getByRole("button")
      .filter({ hasText: /サイドバー|sidebar/i })
      .first();
  }

  /**
   * ページへの遷移
   * ログイン後は/documentsに遷移するため、Headerのチャットリンクをクリックして遷移
   */
  async goto(sessionId?: string) {
    if (sessionId) {
      // セッションIDが指定されている場合は直接URLで遷移
      await this.page.goto(`/chat?sessionId=${sessionId}`);
    } else {
      // まず/documentsページに遷移（ログイン後のデフォルトページ）
      await this.page.goto("/documents");
      await this.page.waitForLoadState("networkidle");

      // Headerのチャットリンクをクリック
      const chatLink = this.page.getByRole("link", { name: /チャット/i });
      await chatLink.click();

      // チャットページに遷移するまで待機
      await this.page.waitForURL(/.*\/chat/, { timeout: 10000 });
    }
  }

  /**
   * 基本的な表示確認
   */
  async verifyPageLoaded() {
    // チャット入力が表示されることを確認
    await expect(this.chatInput).toBeVisible({ timeout: 10000 });
  }

  /**
   * メッセージを送信
   */
  async sendMessage(message: string) {
    await this.chatInput.fill(message);
    await this.sendButton.click();
  }

  /**
   * 新規チャットを開始
   */
  async startNewChat() {
    await this.newChatButton.click();
  }

  /**
   * メッセージが表示されることを確認
   */
  async verifyMessageVisible(message: string) {
    await expect(this.page.getByText(message, { exact: false })).toBeVisible({
      timeout: 10000,
    });
  }

  /**
   * サイドバーをトグル
   */
  async toggleSidebar() {
    if (await this.sidebarToggleButton.isVisible()) {
      await this.sidebarToggleButton.click();
    }
  }

  /**
   * セッションリストが表示されることを確認
   */
  async verifySessionListVisible() {
    await expect(this.sessionSidebar).toBeVisible();
  }

  /**
   * ドキュメントプレビューが表示されることを確認
   */
  async verifyDocumentPreviewVisible() {
    await expect(this.documentPreviewSidebar).toBeVisible();
  }
}
