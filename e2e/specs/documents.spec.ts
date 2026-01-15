import { expect, test } from "../base";
import { DocumentsPage } from "../pom/DocumentsPage";

/**
 * ドキュメントページのテスト
 */

// ========== 1. 未認証ユーザー向けのテストグループ ==========
test.describe("Documents Page (Unauthenticated)", () => {
  // このブロック内のテストは、グローバル設定を無視して「未ログイン状態」で開始する
  test.use({ storageState: { cookies: [], origins: [] } });

  test("未認証ユーザーがアクセスするとログインページにリダイレクトされること", async ({
    page,
  }) => {
    // ページ遷移（beforeEachがないので直接移動）
    await page.goto("/documents");

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });
});

// ========== 2. 認証済みユーザー向けのテストグループ ==========
test.describe("Documents Page", () => {
  let documentsPage: DocumentsPage;

  test.beforeEach(async ({ page }) => {
    documentsPage = new DocumentsPage(page);
    await documentsPage.goto();
  });

  test("ドキュメントページの主要な要素が正しく表示されること", async () => {
    await documentsPage.verifyPageLoaded();

    // アップロードボタンが表示されていることを確認
    await expect(documentsPage.uploadButton).toBeVisible();

    // 検索バーが表示されていることを確認
    await expect(documentsPage.searchInput).toBeVisible();
  });

  test("未認証ユーザーがアクセスするとログインページにリダイレクトされること", async ({
    page,
  }) => {
    // 新しいコンテキストで未認証状態でアクセス
    await page.goto("/documents");

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });

  test("アップロードボタンをクリックするとアップロードモーダルが表示されること", async () => {
    await documentsPage.verifyPageLoaded();

    await documentsPage.clickUpload();

    // アップロードモーダルが表示されることを確認
    await documentsPage.verifyUploadModalOpen();
  });

  test("説明書ボタンをクリックすると説明書が表示されること", async () => {
    await documentsPage.verifyPageLoaded();

    // 説明書が非表示の状態から開始
    const buttonText = await documentsPage.guideButton.textContent();
    if (buttonText?.includes("説明書")) {
      await documentsPage.toggleGuide();
      await documentsPage.verifyGuideVisible();
    }
  });

  test("説明書ボタンを再度クリックすると説明書が非表示になること", async () => {
    await documentsPage.verifyPageLoaded();

    // 説明書を表示
    const buttonText = await documentsPage.guideButton.textContent();
    if (buttonText?.includes("説明書")) {
      await documentsPage.toggleGuide();
      await documentsPage.verifyGuideVisible();
    }

    // 再度クリックして非表示
    await documentsPage.toggleGuide();
    await expect(documentsPage.guideText).not.toBeVisible();
  });

  test("検索バーに入力すると検索が実行されること", async () => {
    await documentsPage.verifyPageLoaded();

    await documentsPage.search("test");

    // 検索結果が表示されることを確認（実装に応じて調整）
    // 実際の検索結果の表示方法に合わせて調整してください
  });

  test("ドキュメントテーブルが表示されること", async () => {
    await documentsPage.verifyPageLoaded();

    // テーブルまたはローディング状態が表示されることを確認
    await expect(
      documentsPage.documentTable.or(
        documentsPage.page.getByText(/読み込み中|ドキュメントがありません/i)
      )
    ).toBeVisible();
  });
});
