import { expect, type Locator, Page } from "@playwright/test";

/**
 * ChatPage のページオブジェクト
 * チャット画面の要素と操作をカプセル化します。
 *
 * 参照: src/app/chat/page.tsx
 * 参照: src/features/chat/components/*
 */
export class ChatPage {
  readonly page: Page;

  // ========== ページ全体 ==========
  readonly pageContainer: Locator;

  // ========== セッションサイドバー ==========
  readonly sessionSidebar: Locator;
  readonly sidebarToggleButton: Locator;
  readonly newChatButton: Locator;
  readonly sessionList: Locator;

  // ========== チャット入力エリア ==========
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly expandButton: Locator;
  readonly minimizeButton: Locator;

  // ========== メッセージエリア ==========
  readonly messagesContainer: Locator;
  readonly loadingIndicator: Locator;
  readonly welcomeMessage: Locator;

  // ========== ドキュメントプレビューサイドバー ==========
  readonly documentPreviewSidebar: Locator;
  readonly documentPreviewCloseButton: Locator;
  readonly documentPreviewTitle: Locator;
  readonly openOriginalFileButton: Locator;

  // ========== セッション編集モーダル ==========
  readonly editSessionModal: Locator;
  readonly editSessionInput: Locator;
  readonly editSessionSaveButton: Locator;
  readonly editSessionCancelButton: Locator;

  // ========== セッション削除モーダル ==========
  readonly deleteSessionModal: Locator;
  readonly deleteSessionConfirmButton: Locator;
  readonly deleteSessionCancelButton: Locator;

  // ========== トースト通知 ==========
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;

    // ページコンテナ
    this.pageContainer = page.locator('div[class*="flex relative"]').first();

    // ========== セッションサイドバー ==========
    // SessionSideBar コンポーネント
    this.sessionSidebar = page.locator("aside").first();

    // ハンバーガーメニューボタン
    this.sidebarToggleButton = page.getByRole("button", {
      name: "チャットハンバーガー",
    });

    // 新規チャット作成ボタン
    this.newChatButton = page
      .getByRole("button", { name: /チャットを新規作成/i })
      .or(page.locator("button:has(.lucide-edit)"));

    // セッションリスト
    this.sessionList = page.locator("ul").filter({
      has: page.locator('a[href*="/chat?sessionId="]'),
    });

    // ========== チャット入力エリア ==========
    // ChatInput コンポーネント - placeholder: "質問を入力してください"
    this.chatInput = page.getByPlaceholder("質問を入力してください");

    // 送信ボタン (id="chat-send-button")
    this.sendButton = page.locator("#chat-send-button");

    // 展開ボタン (最大化)
    this.expandButton = page.getByRole("button", {
      name: "チャット入力を最大化",
    });

    // 縮小ボタン (最小化)
    this.minimizeButton = page.getByRole("button", {
      name: "チャット入力を最小化",
    });

    // ========== メッセージエリア ==========
    // メッセージコンテナ
    this.messagesContainer = page.locator('div[class*="max-w-3xl"]').first();

    // ローディングインジケーター
    this.loadingIndicator = page
      .locator('[class*="loading"]')
      .or(page.getByText("読み込み中"));

    // ウェルカムメッセージ（初期状態）
    this.welcomeMessage = page.getByText(/こんにちは/);

    // ========== ドキュメントプレビューサイドバー ==========
    // DocumentPreviewSidebar コンポーネント
    this.documentPreviewSidebar = page
      .locator("aside")
      .filter({ has: page.getByText("元のファイルを開く") });

    // 閉じるボタン
    this.documentPreviewCloseButton = this.documentPreviewSidebar
      .getByRole("button")
      .first();

    // タイトル（ファイル名）
    this.documentPreviewTitle = this.documentPreviewSidebar
      .locator('[class*="font-semibold"]')
      .first();

    // 元のファイルを開くボタン
    this.openOriginalFileButton = page.getByText("元のファイルを開く");

    // ========== セッション編集モーダル ==========
    this.editSessionModal = page.getByRole("dialog").filter({
      hasText: /チャット名を変更/i,
    });
    this.editSessionInput = this.editSessionModal.locator("input");
    this.editSessionSaveButton = this.editSessionModal.getByRole("button", {
      name: /保存/,
    });
    this.editSessionCancelButton = this.editSessionModal.getByRole("button", {
      name: "キャンセル",
    });

    // ========== セッション削除モーダル ==========
    this.deleteSessionModal = page.getByRole("dialog").filter({
      hasText: /チャットを削除/i,
    });
    this.deleteSessionConfirmButton = this.deleteSessionModal
      .getByRole("button", { name: /削除/ })
      .last();
    this.deleteSessionCancelButton = this.deleteSessionModal.getByRole(
      "button",
      { name: "キャンセル" }
    );

    // ========== トースト通知 ==========
    this.successToast = page
      .getByRole("alert")
      .filter({ hasText: /成功|完了|更新しました/i });
    this.errorToast = page.getByRole("alertdialog").first();
  }

  // ========== ナビゲーション ==========

  /**
   * ページへ遷移
   * @param sessionId オプションのセッションID
   */
  async goto(sessionId?: string) {
    if (sessionId) {
      await this.page.goto(`/chat?sessionId=${sessionId}`);
    } else {
      await this.page.goto("/chat");
    }
  }

  /**
   * ヘッダーのリンクからチャットページへ遷移
   */
  async gotoViaHeader() {
    await this.page.goto("/documents");
    await this.page.waitForLoadState("networkidle");
    const chatLink = this.page.getByRole("link", { name: /チャット/i });
    await chatLink.click();
    await this.page.waitForURL(/.*\/chat/, { timeout: 10000 });
  }

  /**
   * ページの読み込み完了を待機
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  // ========== 基本的な表示確認 ==========

  /**
   * ページが正しく読み込まれたことを確認
   */
  async verifyPageLoaded() {
    await expect(this.chatInput).toBeVisible({ timeout: 10000 });
  }

  /**
   * 主要なUI要素が表示されていることを確認
   */
  async verifyMainElementsVisible() {
    await expect(this.chatInput).toBeVisible();
    await expect(this.sendButton).toBeVisible();
    await expect(this.sessionSidebar).toBeVisible();
  }

  // ========== セッションサイドバー操作 ==========

  /**
   * サイドバーをトグル（開閉）
   */
  async toggleSidebar() {
    await this.sidebarToggleButton.click();
  }

  /**
   * サイドバーが展開されていることを確認
   */
  async verifySidebarExpanded() {
    // 展開時はw-56クラスがある
    await expect(this.sessionSidebar).toHaveClass(/md:w-56|w-full/);
  }

  /**
   * サイドバーが折りたたまれていることを確認
   */
  async verifySidebarCollapsed() {
    await expect(this.sessionSidebar).toHaveClass(/w-16/);
  }

  /**
   * 新規チャットを開始
   */
  async startNewChat() {
    await this.newChatButton.click();
  }

  /**
   * セッションリストが表示されていることを確認
   */
  async verifySessionListVisible() {
    await expect(this.sessionList).toBeVisible();
  }

  /**
   * 特定のセッションをクリック
   */
  async clickSession(sessionId: string) {
    const sessionLink = this.page.locator(
      `a[href="/chat?sessionId=${sessionId}"]`
    );
    await sessionLink.click();
  }

  /**
   * セッションが存在することを確認
   */
  async verifySessionExists(sessionName: string) {
    await expect(this.page.getByText(sessionName)).toBeVisible();
  }

  /**
   * セッションのメニューを開く
   */
  async openSessionMenu(sessionId: string) {
    const sessionLink = this.page.locator(`#session-link-${sessionId}`);
    const menuButton = sessionLink.locator("..").locator("button");
    await menuButton.click();
  }

  /**
   * セッション名を編集
   */
  async editSessionName(sessionId: string, newName: string) {
    await this.openSessionMenu(sessionId);
    await this.page.getByText("名前を変更").click();
    await expect(this.editSessionModal).toBeVisible();
    await this.editSessionInput.clear();
    await this.editSessionInput.fill(newName);
    await this.editSessionSaveButton.click();
  }

  /**
   * セッションを削除
   */
  async deleteSession(sessionId: string) {
    await this.openSessionMenu(sessionId);
    await this.page.getByText("削除").first().click();
    await expect(this.deleteSessionModal).toBeVisible();
    await this.deleteSessionConfirmButton.click();
  }

  // ========== チャット入力操作 ==========

  /**
   * メッセージを入力
   */
  async typeMessage(message: string) {
    await this.chatInput.fill(message);
  }

  /**
   * メッセージを送信
   */
  async sendMessage(message: string) {
    await this.chatInput.fill(message);
    await this.sendButton.click();
  }

  /**
   * Enterキーでメッセージを送信
   */
  async sendMessageByEnter(message: string) {
    await this.chatInput.fill(message);
    await this.chatInput.press("Enter");
  }

  /**
   * 入力欄が空であることを確認
   */
  async verifyInputEmpty() {
    await expect(this.chatInput).toHaveValue("");
  }

  /**
   * 入力欄に特定の値があることを確認
   */
  async verifyInputValue(value: string) {
    await expect(this.chatInput).toHaveValue(value);
  }

  /**
   * 入力欄を展開
   */
  async expandInput() {
    const isVisible = await this.expandButton.isVisible();
    if (isVisible) {
      await this.expandButton.click();
    }
  }

  /**
   * 入力欄を縮小
   */
  async minimizeInput() {
    const isVisible = await this.minimizeButton.isVisible();
    if (isVisible) {
      await this.minimizeButton.click();
    }
  }

  // ========== メッセージ表示確認 ==========

  /**
   * ユーザーメッセージが表示されていることを確認
   */
  async verifyUserMessageVisible(message: string) {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 10000 });
  }

  /**
   * AIレスポンスが表示されていることを確認
   */
  async verifyAIResponseVisible(partialText?: string) {
    if (partialText) {
      await expect(this.page.getByText(partialText)).toBeVisible({
        timeout: 30000,
      });
    } else {
      // 何らかのAIレスポンスが表示されていることを確認
      const aiMessage = this.messagesContainer.locator(
        '[class*="ai-message"], [class*="assistant"]'
      );
      await expect(aiMessage.first()).toBeVisible({ timeout: 30000 });
    }
  }

  /**
   * ストリーミング中であることを確認
   */
  async verifyStreaming() {
    // 停止ボタンが表示されている = ストリーミング中
    await expect(this.sendButton).toHaveAttribute("aria-label", "生成を停止");
  }

  /**
   * ストリーミングが完了したことを確認
   */
  async waitForStreamingComplete() {
    // 送信ボタンのaria-labelが「送信」または「音声入力」に戻るまで待機
    await expect(this.sendButton).not.toHaveAttribute(
      "aria-label",
      "生成を停止",
      { timeout: 60000 }
    );
  }

  /**
   * ストリーミングを停止
   */
  async stopStreaming() {
    const ariaLabel = await this.sendButton.getAttribute("aria-label");
    if (ariaLabel === "生成を停止") {
      await this.sendButton.click();
    }
  }

  /**
   * メッセージの数を取得
   */
  async getMessageCount(): Promise<number> {
    const messages = this.messagesContainer.locator('[class*="space-y-1"]');
    return await messages.count();
  }

  // ========== ドキュメントプレビュー操作 ==========

  /**
   * ドキュメントプレビューが表示されていることを確認
   */
  async verifyDocumentPreviewVisible() {
    await expect(this.documentPreviewSidebar).toBeVisible();
  }

  /**
   * ドキュメントプレビューが非表示であることを確認
   */
  async verifyDocumentPreviewHidden() {
    await expect(this.documentPreviewSidebar).not.toBeVisible();
  }

  /**
   * ドキュメントプレビューを閉じる
   */
  async closeDocumentPreview() {
    await this.documentPreviewCloseButton.click();
  }

  /**
   * 引用元をクリックしてプレビューを開く
   */
  async clickCitation(citationIndex: number = 0) {
    const citations = this.page.locator(
      '[class*="citation"], [class*="source"]'
    );
    await citations.nth(citationIndex).click();
  }

  // ========== モーダル操作 ==========

  /**
   * 編集モーダルが表示されていることを確認
   */
  async verifyEditModalVisible() {
    await expect(this.editSessionModal).toBeVisible();
  }

  /**
   * 編集モーダルを閉じる
   */
  async closeEditModal() {
    await this.editSessionCancelButton.click();
  }

  /**
   * 削除モーダルが表示されていることを確認
   */
  async verifyDeleteModalVisible() {
    await expect(this.deleteSessionModal).toBeVisible();
  }

  /**
   * 削除モーダルを閉じる
   */
  async closeDeleteModal() {
    await this.deleteSessionCancelButton.click();
  }

  // ========== トースト通知 ==========

  /**
   * 成功トーストが表示されることを確認
   */
  async verifySuccessToast(message?: string) {
    if (message) {
      await expect(this.page.getByText(message)).toBeVisible({ timeout: 5000 });
    } else {
      await expect(this.successToast).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * エラートーストが表示されることを確認
   */
  async verifyErrorToast(message?: string) {
    if (message) {
      await expect(this.page.getByText(message)).toBeVisible({ timeout: 5000 });
    } else {
      await expect(this.errorToast).toBeVisible({ timeout: 5000 });
    }
  }

  // ========== URL確認 ==========

  /**
   * URLにセッションIDが含まれていることを確認
   */
  async verifyUrlHasSessionId(sessionId: string) {
    await expect(this.page).toHaveURL(new RegExp(`sessionId=${sessionId}`));
  }

  /**
   * URLにセッションIDが含まれていないことを確認
   */
  async verifyUrlHasNoSessionId() {
    await expect(this.page).not.toHaveURL(/sessionId=/);
  }

  // ========== ユーティリティ ==========

  /**
   * セッションリストのセッション数を取得
   */
  async getSessionCount(): Promise<number> {
    const sessions = this.page.locator('a[href*="/chat?sessionId="]');
    return await sessions.count();
  }

  /**
   * 特定のテキストが画面内に存在することを確認
   */
  async verifyTextVisible(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  /**
   * 特定のテキストが画面内に存在しないことを確認
   */
  async verifyTextNotVisible(text: string) {
    await expect(this.page.getByText(text)).not.toBeVisible();
  }

  /**
   * ローディングが完了するまで待機
   */
  async waitForLoadingComplete() {
    await expect(this.loadingIndicator).not.toBeVisible({ timeout: 30000 });
  }

  /**
   * 送信ボタンのaria-labelを取得
   */
  async getSendButtonState(): Promise<string> {
    return (await this.sendButton.getAttribute("aria-label")) || "";
  }
}
