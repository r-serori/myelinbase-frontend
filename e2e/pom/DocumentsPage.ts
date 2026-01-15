import { expect, type Locator, Page } from "@playwright/test";

/**
 * DocumentsPage のページオブジェクト
 * ドキュメント管理画面の要素と操作をカプセル化します。
 */
export class DocumentsPage {
  readonly page: Page;

  // 主要な要素
  readonly uploadButton: Locator;
  readonly searchInput: Locator;
  readonly documentTable: Locator;
  readonly guideButton: Locator;
  readonly guideText: Locator;
  readonly uploadModal: Locator;
  readonly documentDetailsModal: Locator;
  readonly deleteConfirmDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    // セレクタの定義
    // src/app/documents/page.tsx の実装に基づいています

    // アップロードボタン
    this.uploadButton = page.getByRole("button", {
      name: /ファイルをアップロード/i,
    });

    // 検索バー
    this.searchInput = page.getByPlaceholder(/検索/i).first();

    // ドキュメントテーブル
    this.documentTable = page.getByRole("table").first();

    // 説明書ボタン
    this.guideButton = page.getByRole("button", { name: /説明書|説明を隠す/i });

    // 説明書テキスト
    this.guideText = page.getByText(
      /この画面では、社内ドキュメントのアップロード/
    );

    // モーダル
    this.uploadModal = page.getByRole("dialog").filter({
      hasText: /ファイルをアップロード/i,
    });
    this.documentDetailsModal = page.getByRole("dialog").filter({
      hasText: /詳細/i,
    });
    this.deleteConfirmDialog = page.getByRole("dialog").filter({
      hasText: /削除/i,
    });
  }

  /**
   * ページへの遷移
   */
  async goto() {
    await this.page.goto("/documents");
  }

  /**
   * 基本的な表示確認
   */
  async verifyPageLoaded() {
    await expect(this.uploadButton).toBeVisible();
    // テーブルまたはローディング状態が表示されることを確認
    await expect(
      this.documentTable.or(this.page.getByText(/読み込み中/i))
    ).toBeVisible();
  }

  /**
   * アップロードボタンをクリック
   */
  async clickUpload() {
    await this.uploadButton.click();
  }

  /**
   * アップロードモーダルが表示されることを確認
   */
  async verifyUploadModalOpen() {
    await expect(this.uploadModal).toBeVisible();
  }

  /**
   * 検索を実行
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    // Enterキーを押すか、検索ボタンがあればクリック
    await this.searchInput.press("Enter");
  }

  /**
   * 説明書を表示/非表示
   */
  async toggleGuide() {
    await this.guideButton.click();
  }

  /**
   * 説明書が表示されていることを確認
   */
  async verifyGuideVisible() {
    await expect(this.guideText).toBeVisible();
  }

  /**
   * ドキュメントテーブルにドキュメントが表示されることを確認
   */
  async verifyDocumentInTable(documentName: string) {
    await expect(
      this.page.getByText(documentName, { exact: false })
    ).toBeVisible();
  }

  /**
   * ドキュメントの詳細を開く
   */
  async openDocumentDetails(documentName: string) {
    const documentRow = this.page
      .getByText(documentName, { exact: false })
      .locator("..")
      .locator("..");
    await documentRow.click();
  }

  /**
   * ドキュメントを削除
   */
  async deleteDocument(documentName: string) {
    // 削除ボタンを探してクリック
    const deleteButton = this.page
      .getByText(documentName, { exact: false })
      .locator("..")
      .locator("..")
      .getByRole("button", { name: /削除/i });
    await deleteButton.click();
  }

  /**
   * 削除確認ダイアログで削除を確認
   */
  async confirmDelete() {
    await expect(this.deleteConfirmDialog).toBeVisible();
    const confirmButton = this.deleteConfirmDialog.getByRole("button", {
      name: /削除|確認/i,
    });
    await confirmButton.click();
  }
}
