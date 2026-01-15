import { expect, type Locator, Page } from "@playwright/test";

/**
 * DocumentsPage のページオブジェクト
 * ドキュメント管理画面の要素と操作をカプセル化します。
 *
 * 参照: src/app/documents/page.tsx
 * 参照: src/features/documents/components/*
 */
export class DocumentsPage {
  readonly page: Page;

  // ========== ページ全体の要素 ==========
  readonly pageContainer: Locator;

  // ========== ヘッダー部分 ==========
  readonly uploadButton: Locator;
  readonly guideButton: Locator;
  readonly guideText: Locator;

  // ========== 検索バー部分 ==========
  readonly filenameSearchInput: Locator;
  readonly tagSearchInput: Locator;
  readonly statusDropdown: Locator;
  readonly searchButton: Locator;
  readonly clearAllButton: Locator;

  // ========== ドキュメントテーブル部分 ==========
  readonly documentTableContainer: Locator;
  readonly tableHeader: Locator;
  readonly selectAllCheckbox: Locator;
  readonly loadingIndicator: Locator;
  readonly emptyStateText: Locator;
  readonly pendingDocsIndicator: Locator;
  readonly paginationInfo: Locator;
  readonly firstPageButton: Locator;
  readonly prevPageButton: Locator;
  readonly nextPageButton: Locator;
  readonly lastPageButton: Locator;
  readonly batchDeleteButton: Locator;

  // ========== モーダル ==========
  readonly uploadModal: Locator;
  readonly uploadModalTitle: Locator;
  readonly uploadModalCloseButton: Locator;

  readonly documentDetailsModal: Locator;
  readonly detailsModalCloseButton: Locator;

  readonly deleteConfirmDialog: Locator;
  readonly deleteConfirmInput: Locator;
  readonly deleteConfirmButton: Locator;
  readonly deleteCancelButton: Locator;

  // ========== トースト通知 ==========
  readonly successToast: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;

    // ページコンテナ
    this.pageContainer = page.locator('div[class*="h-full"]').first();

    // ========== ヘッダー部分 ==========
    // アップロードボタン - src/app/documents/page.tsx の実装に基づく
    this.uploadButton = page.getByRole("button", {
      name: /ファイルをアップロード/i,
    });

    // 説明書ボタン
    this.guideButton = page.getByRole("button", { name: /説明書|説明を隠す/i });

    // 説明書テキスト
    this.guideText = page.getByText(
      /この画面では、社内ドキュメントのアップロード・タグ付け・検索ができます/
    );

    // ========== 検索バー部分 ==========
    // ファイル名検索入力
    this.filenameSearchInput = page.getByPlaceholder("就業規則.pdf");

    // タグ検索入力
    this.tagSearchInput = page.getByPlaceholder("例: 会社規定, 労働基準");

    // ステータスドロップダウン
    this.statusDropdown = page
      .locator('[class*="dropdown"]')
      .or(page.getByText("すべて").first());

    // 検索実行ボタン
    this.searchButton = page.getByTitle("検索を実行");

    // 条件クリアボタン
    this.clearAllButton = page.getByRole("button", { name: /すべてクリア/i });

    // ========== ドキュメントテーブル部分 ==========
    // テーブルコンテナ
    this.documentTableContainer = page.locator("table").first();

    // テーブルヘッダー
    this.tableHeader = page
      .locator("thead")
      .or(page.getByText("アップロード済みファイル一覧"));

    // 全選択チェックボックス
    this.selectAllCheckbox = page
      .locator('thead input[type="checkbox"]')
      .first();

    // ローディングインジケーター
    this.loadingIndicator = page
      .locator('[class*="loading"]')
      .or(page.getByText("読み込み中"));

    // 空状態テキスト
    this.emptyStateText = page
      .getByText("ドキュメントが見つかりませんでした。")
      .nth(1);

    // 処理中ドキュメントインジケーター
    this.pendingDocsIndicator = page.getByText(/件のファイルを処理中/);

    // ページネーション情報
    this.paginationInfo = page.getByText(/件中.*件を表示/);

    // ページネーションボタン
    this.firstPageButton = page.getByRole("button", { name: "最初のページ" });
    this.prevPageButton = page.getByRole("button", { name: "前のページ" });
    this.nextPageButton = page.getByRole("button", { name: "次のページ" });
    this.lastPageButton = page.getByRole("button", { name: "最後のページ" });

    // 一括削除ボタン
    this.batchDeleteButton = page.getByRole("button", {
      name: /まとめて削除/i,
    });

    // ========== アップロードモーダル ==========
    this.uploadModal = page.getByRole("dialog", {
      name: "ファイルアップロード",
    });
    this.uploadModalTitle = page.getByText("ファイルアップロード");
    this.uploadModalCloseButton = this.uploadModal.getByRole("button").nth(1);

    // ========== ドキュメント詳細モーダル ==========
    this.documentDetailsModal = page.getByRole("dialog", {
      name: "ファイル詳細",
    });
    this.detailsModalCloseButton = this.documentDetailsModal
      .getByRole("button")
      .first();

    // ========== 削除確認ダイアログ ==========
    this.deleteConfirmDialog = page.getByRole("dialog", {
      name: "削除の確認",
    });
    this.deleteConfirmInput = this.deleteConfirmDialog.locator("input");
    this.deleteConfirmButton = this.deleteConfirmDialog.getByRole("button", {
      name: /削除する/,
    });
    this.deleteCancelButton = this.deleteConfirmDialog.getByRole("button", {
      name: "キャンセル",
    });

    // ========== トースト通知 ==========
    this.successToast = page
      .getByRole("alert")
      .filter({ hasText: /成功|完了/i });
    this.errorToast = page.getByRole("alertdialog").first();
  }

  // ========== ナビゲーション ==========

  /**
   * ページへ遷移
   */
  async goto() {
    await this.page.goto("/documents");
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
    await expect(this.uploadButton).toBeVisible({ timeout: 10000 });
  }

  /**
   * 主要なUI要素が表示されていることを確認
   */
  async verifyMainElementsVisible() {
    await expect(this.uploadButton).toBeVisible();
    await expect(this.filenameSearchInput).toBeVisible();
  }

  /**
   * ドキュメントテーブルが表示されていることを確認（ローディング・空状態・データあり状態のいずれか）
   */
  async verifyTableAreaVisible() {
    // テーブルヘッダーまたはローディング状態または空状態のいずれかが表示されている
    const tableOrLoading = this.documentTableContainer
      .or(this.loadingIndicator)
      .or(this.emptyStateText);
    await expect(tableOrLoading).toBeVisible({ timeout: 10000 });
  }

  // ========== 説明書機能 ==========

  /**
   * 説明書を表示/非表示を切り替え
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
   * 説明書が非表示であることを確認
   */
  async verifyGuideHidden() {
    await expect(this.guideText).not.toBeVisible();
  }

  // ========== アップロードモーダル ==========

  /**
   * アップロードボタンをクリック
   */
  async clickUpload() {
    await this.uploadButton.click();
  }

  /**
   * アップロードモーダルが表示されていることを確認
   */
  async verifyUploadModalOpen() {
    await expect(this.uploadModal).toBeVisible({ timeout: 5000 });
    await expect(this.uploadModalTitle).toBeVisible();
  }

  /**
   * アップロードモーダルを閉じる
   */
  async closeUploadModal() {
    await this.uploadModalCloseButton.click();
  }

  /**
   * アップロードモーダルが閉じていることを確認
   */
  async verifyUploadModalClosed() {
    await expect(this.uploadModal).not.toBeVisible();
  }

  // ========== 検索・フィルター機能 ==========

  /**
   * ファイル名で検索
   */
  async searchByFilename(filename: string) {
    await this.filenameSearchInput.fill(filename);
    await this.searchButton.click();
  }

  /**
   * タグで検索
   */
  async searchByTag(tag: string) {
    await this.tagSearchInput.fill(tag);
    await this.searchButton.click();
  }

  /**
   * ステータスでフィルター
   */
  async filterByStatus(
    status: "すべて" | "完了" | "処理中" | "エラー" | "タグ未設定"
  ) {
    // ドロップダウンを開く
    await this.page.getByText("すべて").first().click();
    // ステータスオプションを選択
    await this.page.getByText(status, { exact: true }).click();
  }

  /**
   * 検索条件をクリア
   */
  async clearAllFilters() {
    const isVisible = await this.clearAllButton.isVisible();
    if (isVisible) {
      await this.clearAllButton.click();
    }
  }

  /**
   * 検索入力をクリア
   */
  async clearFilenameSearch() {
    await this.filenameSearchInput.clear();
  }

  /**
   * タグ入力をクリア
   */
  async clearTagSearch() {
    await this.tagSearchInput.clear();
  }

  // ========== ドキュメントテーブル操作 ==========

  /**
   * 特定のドキュメント行を取得
   */
  getDocumentRow(filename: string): Locator {
    return this.page.locator("tr").filter({ hasText: filename });
  }

  /**
   * ドキュメントが表示されていることを確認
   */
  async verifyDocumentVisible(filename: string) {
    const row = this.getDocumentRow(filename);
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  /**
   * ドキュメントが表示されていないことを確認
   */
  async verifyDocumentNotVisible(filename: string) {
    const row = this.getDocumentRow(filename);
    await expect(row).not.toBeVisible();
  }

  /**
   * ドキュメントのチェックボックスを選択
   */
  async selectDocument(filename: string) {
    const row = this.getDocumentRow(filename);
    const checkbox = row.locator('input[type="checkbox"]');
    await checkbox.check();
  }

  /**
   * ドキュメントのチェックボックスを解除
   */
  async deselectDocument(filename: string) {
    const row = this.getDocumentRow(filename);
    const checkbox = row.locator('input[type="checkbox"]');
    await checkbox.uncheck();
  }

  /**
   * 全てのドキュメントを選択
   */
  async selectAllDocuments() {
    await this.selectAllCheckbox.check();
  }

  /**
   * 全てのドキュメントの選択を解除
   */
  async deselectAllDocuments() {
    await this.selectAllCheckbox.uncheck();
  }

  /**
   * ドキュメントの詳細ボタンをクリック
   */
  async clickDocumentDetails(filename: string) {
    const row = this.getDocumentRow(filename);
    const detailsButton = row.getByRole("button", { name: "詳細" });
    await detailsButton.click();
  }

  /**
   * ドキュメントの削除ボタンをクリック
   */
  async clickDocumentDelete(filename: string) {
    const row = this.getDocumentRow(filename);
    const deleteButton = row.getByRole("button", { name: "削除" });
    await deleteButton.click();
  }

  /**
   * 一括削除ボタンをクリック
   */
  async clickBatchDelete() {
    await this.batchDeleteButton.click();
  }

  // ========== ドキュメント詳細モーダル ==========

  /**
   * ドキュメント詳細モーダルが表示されていることを確認
   */
  async verifyDetailsModalOpen() {
    await expect(this.documentDetailsModal).toBeVisible({ timeout: 5000 });
  }

  /**
   * ドキュメント詳細モーダルを閉じる
   */
  async closeDetailsModal() {
    await this.detailsModalCloseButton.click();
  }

  /**
   * ドキュメント詳細モーダルが閉じていることを確認
   */
  async verifyDetailsModalClosed() {
    await expect(this.documentDetailsModal).not.toBeVisible();
  }

  /**
   * 詳細モーダル内の要素を取得
   */
  getDetailsModalElement(text: string): Locator {
    return this.documentDetailsModal.getByText(text);
  }

  /**
   * 詳細モーダル内のファイル名を確認
   */
  async verifyDetailsModalFileName(filename: string) {
    await expect(this.documentDetailsModal.getByText(filename)).toBeVisible();
  }

  /**
   * 詳細モーダル内のステータスを確認
   */
  async verifyDetailsModalStatus(
    status: "完了" | "処理中" | "エラー" | "保留中"
  ) {
    await expect(this.documentDetailsModal.getByText(status)).toBeVisible();
  }

  /**
   * 詳細モーダル内のローディング状態を確認
   */
  async verifyDetailsModalLoading() {
    await expect(
      this.documentDetailsModal.getByText("Loading...")
    ).toBeVisible();
  }

  /**
   * 詳細モーダル内のドキュメント未発見メッセージを確認
   */
  async verifyDetailsModalNotFound() {
    await expect(
      this.documentDetailsModal.getByText(
        "ドキュメントが見つかりませんでした。"
      )
    ).toBeVisible();
  }

  /**
   * タグ入力フィールド（詳細モーダル内）
   */
  getTagInputInDetailsModal(): Locator {
    return this.documentDetailsModal.getByPlaceholder("新しいタグを入力...");
  }

  /**
   * タグ追加ボタン（詳細モーダル内）
   */
  getAddTagButtonInDetailsModal(): Locator {
    return this.documentDetailsModal.getByRole("button", { name: /追加/ });
  }

  /**
   * タグ保存ボタン（詳細モーダル内）
   */
  getSaveTagsButtonInDetailsModal(): Locator {
    return this.documentDetailsModal.getByRole("button", {
      name: /タグを保存/,
    });
  }

  /**
   * ファイルを開くボタン（詳細モーダル内）
   */
  getOpenFileButtonInDetailsModal(): Locator {
    return this.documentDetailsModal.getByRole("button", {
      name: /ファイルを開く/,
    });
  }

  /**
   * タグ数表示を取得（詳細モーダル内）
   */
  getTagCountInDetailsModal(): Locator {
    return this.documentDetailsModal.getByText(/\d+個/);
  }

  /**
   * 空タグメッセージを確認（詳細モーダル内）
   */
  async verifyEmptyTagMessage() {
    await expect(
      this.documentDetailsModal.getByText("タグはまだ設定されていません")
    ).toBeVisible();
  }

  /**
   * タグ上限警告を確認（詳細モーダル内）
   */
  async verifyTagLimitWarning() {
    await expect(
      this.documentDetailsModal.getByText(/タグの上限（20個）を超えています/)
    ).toBeVisible();
  }

  /**
   * 処理中メッセージを確認（詳細モーダル内）
   */
  async verifyProcessingMessage() {
    await expect(
      this.documentDetailsModal.getByText(
        /処理が完了するまでプレビュー機能は利用できません/
      )
    ).toBeVisible();
  }

  /**
   * ステータスメッセージを確認（詳細モーダル内）
   */
  async verifyStatusMessage() {
    await expect(
      this.documentDetailsModal.getByText(
        /ステータスが「完了」になると、チャットで参照可能なファイルになります/
      )
    ).toBeVisible();
  }

  /**
   * 詳細モーダルでタグを追加
   */
  async addTagInDetailsModal(tag: string) {
    const tagInput = this.getTagInputInDetailsModal();
    const addButton = this.getAddTagButtonInDetailsModal();
    await tagInput.fill(tag);
    await addButton.click();
  }

  /**
   * 詳細モーダルでEnterキーでタグを追加
   */
  async addTagByEnterInDetailsModal(tag: string) {
    const tagInput = this.getTagInputInDetailsModal();
    await tagInput.fill(tag);
    await tagInput.press("Enter");
  }

  /**
   * 詳細モーダルでタグを保存
   */
  async saveTagsInDetailsModal() {
    const saveButton = this.getSaveTagsButtonInDetailsModal();
    await saveButton.click();
  }

  /**
   * 詳細モーダルでファイルを開く
   */
  async openFileInDetailsModal() {
    const openButton = this.getOpenFileButtonInDetailsModal();
    await openButton.click();
  }

  /**
   * 詳細モーダル内でタグが表示されていることを確認
   */
  async verifyTagVisibleInDetailsModal(tag: string) {
    await expect(this.documentDetailsModal.getByText(tag)).toBeVisible();
  }

  /**
   * 詳細モーダル内でタグが表示されていないことを確認
   */
  async verifyTagNotVisibleInDetailsModal(tag: string) {
    await expect(this.documentDetailsModal.getByText(tag)).not.toBeVisible();
  }

  /**
   * 詳細モーダル内のタグ削除ボタンをクリック
   */
  async removeTagInDetailsModal(tagIndex: number = 0) {
    const deleteButtons = this.documentDetailsModal.getByTitle("タグを削除");
    await deleteButtons.nth(tagIndex).click();
  }

  /**
   * 詳細モーダルの追加ボタンが無効化されていることを確認
   */
  async verifyAddTagButtonDisabled() {
    const addButton = this.getAddTagButtonInDetailsModal();
    await expect(addButton).toBeDisabled();
  }

  /**
   * 詳細モーダルの追加ボタンが有効化されていることを確認
   */
  async verifyAddTagButtonEnabled() {
    const addButton = this.getAddTagButtonInDetailsModal();
    await expect(addButton).toBeEnabled();
  }

  /**
   * 詳細モーダルの保存ボタンが無効化されていることを確認
   */
  async verifySaveTagsButtonDisabled() {
    const saveButton = this.getSaveTagsButtonInDetailsModal();
    await expect(saveButton).toBeDisabled();
  }

  /**
   * 詳細モーダルの保存ボタンが有効化されていることを確認
   */
  async verifySaveTagsButtonEnabled() {
    const saveButton = this.getSaveTagsButtonInDetailsModal();
    await expect(saveButton).toBeEnabled();
  }

  /**
   * 詳細モーダルのファイルを開くボタンが無効化されていることを確認
   */
  async verifyOpenFileButtonDisabled() {
    const openButton = this.getOpenFileButtonInDetailsModal();
    await expect(openButton).toBeDisabled();
  }

  /**
   * 詳細モーダルのファイルを開くボタンが有効化されていることを確認
   */
  async verifyOpenFileButtonEnabled() {
    const openButton = this.getOpenFileButtonInDetailsModal();
    await expect(openButton).toBeEnabled();
  }

  /**
   * 詳細モーダルでタグ入力欄の値を確認
   */
  async verifyTagInputValue(value: string) {
    const tagInput = this.getTagInputInDetailsModal();
    await expect(tagInput).toHaveValue(value);
  }

  /**
   * 詳細モーダルでタグ入力欄が空であることを確認
   */
  async verifyTagInputEmpty() {
    const tagInput = this.getTagInputInDetailsModal();
    await expect(tagInput).toHaveValue("");
  }

  // ========== 削除確認ダイアログ ==========

  /**
   * 削除確認ダイアログが表示されていることを確認
   */
  async verifyDeleteDialogOpen() {
    await expect(this.deleteConfirmDialog).toBeVisible({ timeout: 5000 });
  }

  /**
   * 削除確認ダイアログが閉じていることを確認
   */
  async verifyDeleteDialogClosed() {
    await expect(this.deleteConfirmDialog).not.toBeVisible();
  }

  /**
   * 削除確認テキストを入力
   */
  async fillDeleteConfirmation(text: string) {
    await this.deleteConfirmInput.fill(text);
  }

  /**
   * 削除を確定
   */
  async confirmDelete() {
    await this.deleteConfirmButton.click();
  }

  /**
   * 削除をキャンセル
   */
  async cancelDelete() {
    await this.deleteCancelButton.click();
  }

  /**
   * 削除確認ボタンが無効化されていることを確認
   */
  async verifyDeleteButtonDisabled() {
    await expect(this.deleteConfirmButton).toBeDisabled();
  }

  /**
   * 削除確認ボタンが有効化されていることを確認
   */
  async verifyDeleteButtonEnabled() {
    await expect(this.deleteConfirmButton).toBeEnabled();
  }

  // ========== ページネーション ==========

  /**
   * 次のページへ移動
   */
  async goToNextPage() {
    await this.nextPageButton.click();
  }

  /**
   * 前のページへ移動
   */
  async goToPrevPage() {
    await this.prevPageButton.click();
  }

  /**
   * 最初のページへ移動
   */
  async goToFirstPage() {
    await this.firstPageButton.click();
  }

  /**
   * 最後のページへ移動
   */
  async goToLastPage() {
    await this.lastPageButton.click();
  }

  /**
   * ページネーションが表示されていることを確認
   */
  async verifyPaginationVisible() {
    await expect(this.paginationInfo).toBeVisible();
  }

  /**
   * 現在のページ番号を取得
   */
  async getCurrentPageInfo(): Promise<string> {
    const text = await this.page.getByText(/\d+\s*\/\s*\d+/).textContent();
    return text || "";
  }

  // ========== ステータス関連 ==========

  /**
   * 処理中ドキュメントのインジケーターが表示されていることを確認
   */
  async verifyPendingDocsIndicatorVisible() {
    await expect(this.pendingDocsIndicator).toBeVisible();
  }

  /**
   * ドキュメントのステータスを確認
   */
  async verifyDocumentStatus(
    filename: string,
    status: "完了" | "処理中" | "エラー" | "保留中"
  ) {
    const row = this.getDocumentRow(filename);
    await expect(row.getByText(status)).toBeVisible();
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

  // ========== 空状態 ==========

  /**
   * 空状態が表示されていることを確認
   */
  async verifyEmptyState() {
    await expect(this.emptyStateText).toBeVisible();
  }

  // ========== ローディング状態 ==========

  /**
   * ローディング状態が表示されていることを確認
   */
  async verifyLoadingState() {
    await expect(this.loadingIndicator).toBeVisible();
  }

  /**
   * ローディング状態が終了したことを確認
   */
  async waitForLoadingToComplete() {
    await expect(this.loadingIndicator).not.toBeVisible({ timeout: 30000 });
  }

  // ========== ユーティリティメソッド ==========

  /**
   * ドキュメントの総数を取得（表示されている場合）
   */
  async getDocumentCount(): Promise<number> {
    const text = await this.paginationInfo.textContent();
    if (!text) return 0;
    const match = text.match(/(\d+)\s*件中/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * 表示されているドキュメント行の数を取得
   */
  async getVisibleDocumentRowCount(): Promise<number> {
    const rows = this.page.locator("tbody tr").filter({
      hasNot: this.loadingIndicator,
    });
    return await rows.count();
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
}
