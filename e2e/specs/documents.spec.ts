import { expect, test } from "../base";
import { DocumentsPage } from "../pom/DocumentsPage";

/**
 * ドキュメントページのE2Eテスト
 *
 * テスト対象: src/app/documents/page.tsx
 * 参照コンポーネント:
 *   - DocumentSearchBar
 *   - DocumentTable
 *   - FileUploadModal
 *   - DocumentDetailsModal
 *   - DeleteConfirmDialog
 */

// ============================================================================
// 1. 未認証ユーザー向けのテストグループ
// ============================================================================
test.describe("Documents Page (Unauthenticated)", () => {
  // このブロック内のテストは、グローバル設定を無視して「未ログイン状態」で開始する
  test.use({ storageState: { cookies: [], origins: [] } });

  test("未認証ユーザーがアクセスするとログインページにリダイレクトされること", async ({
    page,
  }) => {
    await page.goto("/documents");

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });
});

// ============================================================================
// 2. 認証済みユーザー向けのテストグループ
// ============================================================================
test.describe("Documents Page", () => {
  let documentsPage: DocumentsPage;

  test.beforeEach(async ({ page }) => {
    documentsPage = new DocumentsPage(page);
    await documentsPage.goto();
    await documentsPage.verifyPageLoaded();
  });

  // ==========================================================================
  // 2.1 ページ表示と基本要素
  // ==========================================================================
  test.describe("Page Load and Basic Elements", () => {
    test("ドキュメントページの主要な要素が正しく表示されること", async () => {
      // アップロードボタンが表示されていることを確認
      await expect(documentsPage.uploadButton).toBeVisible();

      // ファイル名検索入力が表示されていることを確認
      await expect(documentsPage.filenameSearchInput).toBeVisible();
    });

    test("ドキュメントテーブルエリアが表示されること", async () => {
      await documentsPage.verifyTableAreaVisible();
    });

    test("テーブルヘッダーのラベルが正しく表示されること", async ({ page }) => {
      // 「アップロード済みファイル一覧」テキストが表示されることを確認
      await expect(
        page.getByText("アップロード済みファイル一覧")
      ).toBeVisible();
    });
  });

  // ==========================================================================
  // 2.2 説明書機能
  // ==========================================================================
  test.describe("Guide Feature", () => {
    test("説明書ボタンが表示されていること", async () => {
      await expect(documentsPage.guideButton).toBeVisible();
    });

    test("説明書ボタンをクリックすると説明書が表示されること", async () => {
      // 説明書ボタンのテキストを確認して、表示状態を判断
      const buttonText = await documentsPage.guideButton.textContent();

      if (buttonText?.includes("説明書")) {
        // 説明書が非表示の状態 → クリックして表示
        await documentsPage.toggleGuide();
        await documentsPage.verifyGuideVisible();
      } else {
        // 既に表示されている場合はそのまま確認
        await documentsPage.verifyGuideVisible();
      }
    });

    test("説明書ボタンを再度クリックすると説明書が非表示になること", async () => {
      // 説明書が非表示なら表示
      const buttonText = await documentsPage.guideButton.textContent();
      if (buttonText?.includes("説明書")) {
        await documentsPage.toggleGuide();
      }

      // 表示されていることを確認
      await documentsPage.verifyGuideVisible();

      // 再度クリックして非表示にする
      await documentsPage.toggleGuide();

      // 非表示になったことを確認
      await documentsPage.verifyGuideHidden();
    });

    test("説明書に正しいコンテンツが含まれていること", async ({ page }) => {
      // 説明書を表示
      const buttonText = await documentsPage.guideButton.textContent();
      if (buttonText?.includes("説明書")) {
        await documentsPage.toggleGuide();
      }

      // 説明書の内容が正しいことを確認
      await expect(
        page.getByText(/社内ドキュメントのアップロード・タグ付け・検索/)
      ).toBeVisible();
    });
  });

  // ==========================================================================
  // 2.3 アップロードモーダル
  // ==========================================================================
  test.describe("Upload Modal", () => {
    test("アップロードボタンをクリックするとアップロードモーダルが表示されること", async () => {
      await documentsPage.clickUpload();
      await documentsPage.verifyUploadModalOpen();
    });

    test("アップロードモーダルのタイトルが正しいこと", async ({ page }) => {
      await documentsPage.clickUpload();
      await expect(page.getByText("ファイルアップロード")).toBeVisible();
    });

    test("アップロードモーダルを閉じることができること", async () => {
      await documentsPage.clickUpload();
      await documentsPage.verifyUploadModalOpen();

      await documentsPage.closeUploadModal();
      await documentsPage.verifyUploadModalClosed();
    });

    test("アップロードモーダル内にファイル選択エリアが表示されること", async ({
      page,
    }) => {
      await documentsPage.clickUpload();
      await documentsPage.verifyUploadModalOpen();

      // ファイル選択ボタンまたはドラッグ&ドロップエリアが表示されることを確認
      const uploadArea = page
        .getByText(/ファイルを選択/)
        .or(page.getByText(/ドラッグ/));
      await expect(uploadArea).toBeVisible();
    });
  });

  // ==========================================================================
  // 2.4 検索・フィルター機能
  // ==========================================================================
  test.describe("Search and Filter", () => {
    test("ファイル名検索入力フィールドが機能すること", async () => {
      // 検索入力が空の状態で開始
      await expect(documentsPage.filenameSearchInput).toHaveValue("");

      // 検索ワードを入力
      await documentsPage.filenameSearchInput.fill("test-document");

      // 入力が反映されていることを確認
      await expect(documentsPage.filenameSearchInput).toHaveValue(
        "test-document"
      );
    });

    test("ファイル名検索入力をクリアできること", async () => {
      // 検索ワードを入力
      await documentsPage.filenameSearchInput.fill("test-document");
      await expect(documentsPage.filenameSearchInput).toHaveValue(
        "test-document"
      );

      // クリア
      await documentsPage.clearFilenameSearch();
      await expect(documentsPage.filenameSearchInput).toHaveValue("");
    });

    test("タグ検索入力フィールドが機能すること", async () => {
      // タグ入力フィールドにフォーカスして入力
      await documentsPage.tagSearchInput.fill("会社規定");
      await expect(documentsPage.tagSearchInput).toHaveValue("会社規定");
    });

    test("タグ検索入力をクリアできること", async () => {
      await documentsPage.tagSearchInput.fill("会社規定");
      await documentsPage.clearTagSearch();
      await expect(documentsPage.tagSearchInput).toHaveValue("");
    });

    test("検索ボタンが表示されていること", async () => {
      await expect(documentsPage.searchButton).toBeVisible();
    });

    test("検索ボタンをクリックすると検索が実行されること", async () => {
      // ファイル名を入力して検索実行
      await documentsPage.filenameSearchInput.fill("nonexistent-file");
      await documentsPage.searchButton.click();

      // 検索が実行されたことを確認（空の結果または結果表示）
      // 存在しないファイル名で検索した場合は空の状態が表示される可能性がある
      await documentsPage.waitForPageLoad();
    });
  });

  // ==========================================================================
  // 2.5 ドキュメントテーブル（データがある場合の動作）
  // ==========================================================================
  test.describe("Document Table Operations", () => {
    test("ローディング完了後にテーブルまたは空状態が表示されること", async () => {
      // ローディングが完了するまで待機
      await documentsPage.page.waitForLoadState("networkidle");

      // テーブルまたは空状態が表示されることを確認
      const tableOrEmpty = documentsPage.documentTableContainer.or(
        documentsPage.emptyStateText
      );
      await expect(tableOrEmpty).toBeVisible({ timeout: 15000 });
    });

    test("テーブルヘッダーに必要なカラムが表示されていること", async ({
      page,
    }) => {
      await documentsPage.page.waitForLoadState("networkidle");

      // ドキュメントがある場合のみテスト
      const hasDocuments =
        await documentsPage.documentTableContainer.isVisible();
      if (hasDocuments) {
        // ヘッダーカラムを確認
        await expect(page.getByText("ファイル名").nth(1)).toBeVisible();
        await expect(page.getByText("ステータス").nth(1)).toBeVisible();
        await expect(page.getByText("タグ").nth(1)).toBeVisible();
        await expect(page.getByText("作成日時").first()).toBeVisible();
        await expect(page.getByText("操作").first()).toBeVisible();
      }
    });
  });

  // ==========================================================================
  // 2.6 空状態の表示
  // ==========================================================================
  test.describe("Empty State", () => {
    test("ドキュメントが存在しない場合または検索結果が0件の場合、空状態メッセージが表示されること", async () => {
      // 存在しないファイル名で検索して空状態をトリガー
      await documentsPage.searchByFilename("absolutely-nonexistent-file-12345");
      await documentsPage.page.waitForLoadState("networkidle");

      // 空状態メッセージまたは元のテーブルが表示されていることを確認
      // （データがある場合は検索でフィルタリングされ、結果が0件になる可能性がある）
      const emptyOrTable = documentsPage.emptyStateText.or(
        documentsPage.documentTableContainer
      );
      await expect(emptyOrTable).toBeVisible({ timeout: 10000 });
    });
  });

  // ==========================================================================
  // 2.7 削除確認ダイアログ（UI要素のみテスト - 実際の削除は行わない）
  // ==========================================================================
  test.describe("Delete Confirmation Dialog", () => {
    // NOTE: 目視で確認する
    // NOTE: これらのテストは実際のドキュメントが存在することを前提としている
    // NOTE: 実際の環境では、テストデータの事前準備が必要

    // test("全選択チェックボックスが機能すること", async () => {
    //   await documentsPage.selectAllCheckbox.click();
    //   await expect(documentsPage.selectAllCheckbox).toBeChecked();
    // });

    // test("削除ボタンが機能すること", async () => {
    //   await documentsPage.batchDeleteButton.click();
    //   await expect(documentsPage.deleteConfirmDialog).toBeVisible();
    // });

    test.skip("削除ダイアログが正しい構造を持っていること", async ({
      page,
    }) => {
      // このテストは実際のドキュメントがある場合にのみ実行可能
      // 削除ボタンをクリックして削除ダイアログを表示
      // テストデータが必要なためスキップ
    });
  });

  // ==========================================================================
  // 2.8 ページネーション（ドキュメントが多い場合）
  // ==========================================================================
  test.describe("Pagination", () => {
    test("ドキュメントが20件以上ある場合、ページネーションが表示されること", async () => {
      await documentsPage.page.waitForLoadState("networkidle");

      // ページネーション情報が表示されているかチェック
      const isPaginationVisible =
        await documentsPage.paginationInfo.isVisible();

      if (isPaginationVisible) {
        // ページネーションが表示されている場合、ナビゲーションボタンも確認
        await expect(documentsPage.firstPageButton).toBeVisible();
        await expect(documentsPage.lastPageButton).toBeVisible();
      }
      // ドキュメントが20件未満の場合はページネーションが表示されないのは正常
    });
  });

  // ==========================================================================
  // 2.9 URLとナビゲーション
  // ==========================================================================
  test.describe("URL and Navigation", () => {
    test("ドキュメントページのURLが正しいこと", async ({ page }) => {
      await expect(page).toHaveURL(/.*\/documents/);
    });

    test("ページをリロードしても正しく表示されること", async ({ page }) => {
      await page.reload();
      await documentsPage.verifyPageLoaded();
    });
  });

  // ==========================================================================
  // 2.10 レスポンシブデザイン関連
  // ==========================================================================
  test.describe("Responsive Design", () => {
    test("モバイルサイズでもアップロードボタンが表示されること", async ({
      page,
    }) => {
      // モバイルサイズにビューポートを設定
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();

      // アップロードボタンが表示されることを確認
      await expect(documentsPage.uploadButton).toBeVisible({ timeout: 10000 });
    });

    test("タブレットサイズでも主要な要素が表示されること", async ({ page }) => {
      // タブレットサイズにビューポートを設定
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();

      // 主要な要素が表示されることを確認
      await documentsPage.verifyPageLoaded();
      await expect(documentsPage.filenameSearchInput).toBeVisible();
    });
  });

  // ==========================================================================
  // 2.11 アクセシビリティ
  // ==========================================================================
  test.describe("Accessibility", () => {
    test("検索入力フィールドにプレースホルダーが設定されていること", async () => {
      // ファイル名検索のプレースホルダー
      await expect(documentsPage.filenameSearchInput).toHaveAttribute(
        "placeholder",
        "例: 就業規則.pdf"
      );
    });
  });

  // ==========================================================================
  // 2.12 エラー状態のハンドリング
  // ==========================================================================
  test.describe("Error Handling", () => {
    test("ネットワークエラー時にもページがクラッシュしないこと", async ({
      page,
    }) => {
      // ネットワークリクエストを一時的に失敗させる
      await page.route("**/api/documents**", (route) => {
        route.abort();
      });

      // ページをリロード
      await page.reload();

      // ページがクラッシュせずに表示されることを確認
      // エラー状態でもアップロードボタンは表示されるはず
      await expect(documentsPage.uploadButton).toBeVisible({ timeout: 15000 });

      // ルーティングを解除
      await page.unroute("**/api/documents**");
    });
  });
});

// ============================================================================
// 5. DocumentDetailsModal
// ============================================================================
test.describe("DocumentDetailsModal", () => {
  let documentsPage: DocumentsPage;

  test.beforeEach(async ({ page }) => {
    documentsPage = new DocumentsPage(page);
    await documentsPage.goto();
    await documentsPage.verifyPageLoaded();
    await documentsPage.page.waitForLoadState("networkidle");
  });

  // ==========================================================================
  // 5.1 モーダルの表示・非表示
  // ==========================================================================
  test.describe("Modal Open/Close", () => {
    test("ドキュメントの詳細ボタンをクリックすると詳細モーダルが表示されること", async () => {
      // ドキュメントが存在する場合のみテスト実行
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 最初のドキュメントの詳細ボタンをクリック
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();

      // 詳細モーダルが表示されることを確認
      await documentsPage.verifyDetailsModalOpen();
    });

    test("詳細モーダルの閉じるボタンをクリックするとモーダルが閉じること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // モーダルを閉じる
      await documentsPage.closeDetailsModal();

      // モーダルが閉じたことを確認
      await documentsPage.verifyDetailsModalClosed();
    });

    test("詳細モーダルを閉じた後、ページが正常な状態を維持すること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // モーダルを閉じる
      await documentsPage.closeDetailsModal();
      await documentsPage.verifyDetailsModalClosed();

      // ページが正常な状態であることを確認
      await expect(documentsPage.uploadButton).toBeVisible();
      await expect(documentsPage.filenameSearchInput).toBeVisible();
    });
  });

  // ==========================================================================
  // 5.2 ドキュメント情報の表示
  // ==========================================================================
  test.describe("Document Information Display", () => {
    test("詳細モーダルにファイル名が表示されること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 最初のドキュメントのファイル名を取得
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const fileName = await firstRow.locator("td").nth(1).textContent();

      // 詳細モーダルを開く
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // ファイル名が表示されていることを確認
      if (fileName) {
        await documentsPage.verifyDetailsModalFileName(fileName.trim());
      }
    });

    test("詳細モーダルにステータスが表示されること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // ステータスラベルが表示されていることを確認
      await expect(
        documentsPage.documentDetailsModal.getByText("ステータス")
      ).toBeVisible();
    });

    test("詳細モーダルに作成日時が表示されること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // 作成日時ラベルが表示されていることを確認
      await expect(
        documentsPage.documentDetailsModal.getByText("作成日時")
      ).toBeVisible();
    });

    test("詳細モーダルにタグ設定セクションが表示されること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // タグ設定セクションが表示されていることを確認
      await expect(
        documentsPage.documentDetailsModal.getByText("タグ設定")
      ).toBeVisible();
    });
  });

  // ==========================================================================
  // 5.3 タグ操作
  // ==========================================================================
  test.describe("Tag Operations", () => {
    test("タグ入力フィールドが表示されること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // タグ入力フィールドが表示されていることを確認
      const tagInput = documentsPage.getTagInputInDetailsModal();
      await expect(tagInput).toBeVisible();
    });

    test("タグ追加ボタンが表示されること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // 追加ボタンが表示されていることを確認
      const addButton = documentsPage.getAddTagButtonInDetailsModal();
      await expect(addButton).toBeVisible();
    });

    test("タグ入力が空の場合、追加ボタンが無効化されていること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // 入力が空の状態で追加ボタンが無効化されていることを確認
      await documentsPage.verifyTagInputEmpty();
      await documentsPage.verifyAddTagButtonDisabled();
    });

    test("タグを入力すると追加ボタンが有効化されること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // タグを入力
      const tagInput = documentsPage.getTagInputInDetailsModal();
      await tagInput.fill("新しいタグ");

      // 追加ボタンが有効化されていることを確認
      await documentsPage.verifyAddTagButtonEnabled();
    });

    test("タグを追加すると入力欄がクリアされること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // タグを追加
      await documentsPage.addTagInDetailsModal("テストタグ");

      // 入力欄がクリアされていることを確認
      await documentsPage.verifyTagInputEmpty();
    });

    test("Enterキーでタグを追加できること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // Enterキーでタグを追加
      await documentsPage.addTagByEnterInDetailsModal("Enterタグ");

      // 入力欄がクリアされていることを確認
      await documentsPage.verifyTagInputEmpty();
    });

    test("タグ保存ボタンが表示されること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // 保存ボタンが表示されていることを確認
      const saveButton = documentsPage.getSaveTagsButtonInDetailsModal();
      await expect(saveButton).toBeVisible();
    });

    test("タグが変更されていない場合、保存ボタンが無効化されていること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // 保存ボタンが無効化されていることを確認
      await documentsPage.verifySaveTagsButtonDisabled();
    });

    test("タグを追加すると保存ボタンが有効化されること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // タグを追加
      await documentsPage.addTagInDetailsModal("有効化テスト");

      // 保存ボタンが有効化されていることを確認
      await documentsPage.verifySaveTagsButtonEnabled();
    });
  });

  // ==========================================================================
  // 5.4 ファイルプレビュー/ダウンロード機能
  // ==========================================================================
  test.describe("File Preview/Download", () => {
    test("完了ステータスのドキュメントにはファイルを開くボタンが表示されること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 完了ステータスのドキュメントを探す
      const completedRow = documentsPage.page
        .locator("tbody tr")
        .filter({ hasText: "完了" })
        .first();
      const isCompletedRowVisible = await completedRow.isVisible();

      if (!isCompletedRowVisible) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const detailsButton = completedRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // ファイルを開くボタンが表示されていることを確認
      const openButton = documentsPage.getOpenFileButtonInDetailsModal();
      await expect(openButton).toBeVisible();
    });

    test("処理中ステータスのドキュメントにはファイルを開くボタンが表示されないこと", async () => {
      // 処理中ステータスのドキュメントを探す
      const processingRow = documentsPage.page
        .locator("tbody tr")
        .filter({ hasText: "処理中" })
        .first();
      const isProcessingRowVisible = await processingRow.isVisible();

      if (!isProcessingRowVisible) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const detailsButton = processingRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // ファイルを開くボタンが表示されていないことを確認
      const openButton = documentsPage.getOpenFileButtonInDetailsModal();
      await expect(openButton).not.toBeVisible();

      // 代わりにメッセージが表示されていることを確認
      await documentsPage.verifyProcessingMessage();
    });
  });

  // ==========================================================================
  // 5.5 タグ数表示
  // ==========================================================================
  test.describe("Tag Count Display", () => {
    test("タグ数が正しく表示されること", async () => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // 詳細モーダルを開く
      const firstRow = documentsPage.page.locator("tbody tr").first();
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // タグ数表示が存在することを確認（0個以上）
      const tagCount = documentsPage.getTagCountInDetailsModal();
      await expect(tagCount).toBeVisible();
    });
  });

  // ==========================================================================
  // 5.6 エラーハンドリング
  // ==========================================================================
  test.describe("Error Handling", () => {
    test("APIエラー時にもモーダルがクラッシュしないこと", async ({ page }) => {
      const documentCount = await documentsPage.getVisibleDocumentRowCount();
      if (documentCount === 0) {
        test.skip();
        return;
      }

      // タグ保存APIをエラーにする
      await page.route("**/api/documents/*/tags**", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal Server Error" }),
        });
      });

      // 詳細モーダルを開く
      // 1から10までのランダムな行を選択
      const randomRow = Math.floor(Math.random() * 10) + 1;
      const firstRow = documentsPage.page.locator("tbody tr").nth(randomRow);
      const detailsButton = firstRow.getByRole("button", { name: "詳細" });
      await detailsButton.click();
      await documentsPage.verifyDetailsModalOpen();

      // タグを追加して保存を試みる
      const randomTag = Math.random().toString(36).substring(2, 15);
      await documentsPage.addTagInDetailsModal("エラーテスト" + randomTag);
      await documentsPage.saveTagsInDetailsModal();

      // モーダルが表示され続けていることを確認（クラッシュしていない）
      await documentsPage.verifyDetailsModalOpen();
      // ルーティングを解除
      await page.unroute("**/api/documents/*/tags**");
    });
  });
});

// ============================================================================
// 6. DocumentDetailsModal インテグレーションテスト
// ============================================================================
test.describe("DocumentDetailsModal Integration", () => {
  let documentsPage: DocumentsPage;

  test.beforeEach(async ({ page }) => {
    documentsPage = new DocumentsPage(page);
    await documentsPage.goto();
    await documentsPage.verifyPageLoaded();
    await documentsPage.page.waitForLoadState("networkidle");
  });

  test("詳細モーダルでタグ操作後、保存せずに閉じてもページが正常であること", async () => {
    const documentCount = await documentsPage.getVisibleDocumentRowCount();
    if (documentCount === 0) {
      test.skip();
      return;
    }

    // 詳細モーダルを開く
    const firstRow = documentsPage.page.locator("tbody tr").first();
    const detailsButton = firstRow.getByRole("button", { name: "詳細" });
    await detailsButton.click();
    await documentsPage.verifyDetailsModalOpen();

    // タグを追加（保存しない）
    await documentsPage.addTagInDetailsModal("未保存タグ");

    // モーダルを閉じる
    await documentsPage.closeDetailsModal();
    await documentsPage.verifyDetailsModalClosed();

    // ページが正常な状態であることを確認
    await expect(documentsPage.uploadButton).toBeVisible();
    await expect(documentsPage.filenameSearchInput).toBeVisible();
  });

  test("複数のドキュメントの詳細を連続して確認できること", async () => {
    const documentCount = await documentsPage.getVisibleDocumentRowCount();
    if (documentCount < 2) {
      test.skip();
      return;
    }

    // 最初のドキュメントの詳細を確認
    const firstRow = documentsPage.page.locator("tbody tr").first();
    const firstDetailsButton = firstRow.getByRole("button", { name: "詳細" });
    await firstDetailsButton.click();
    await documentsPage.verifyDetailsModalOpen();
    await documentsPage.closeDetailsModal();
    await documentsPage.verifyDetailsModalClosed();

    // 2番目のドキュメントの詳細を確認
    const secondRow = documentsPage.page.locator("tbody tr").nth(1);
    const secondDetailsButton = secondRow.getByRole("button", { name: "詳細" });
    await secondDetailsButton.click();
    await documentsPage.verifyDetailsModalOpen();
    await documentsPage.closeDetailsModal();
    await documentsPage.verifyDetailsModalClosed();

    // ページが正常な状態であることを確認
    await expect(documentsPage.uploadButton).toBeVisible();
  });
});

// ============================================================================
// 3. インテグレーションテスト（複数の機能の組み合わせ）
// ============================================================================
test.describe("Documents Page Integration", () => {
  let documentsPage: DocumentsPage;

  test.beforeEach(async ({ page }) => {
    documentsPage = new DocumentsPage(page);
    await documentsPage.goto();
    await documentsPage.verifyPageLoaded();
  });

  test("アップロードモーダルを開いて閉じた後、ページが正常な状態を維持すること", async () => {
    // モーダルを開く
    await documentsPage.clickUpload();
    await documentsPage.verifyUploadModalOpen();

    // モーダルを閉じる
    await documentsPage.closeUploadModal();
    await documentsPage.verifyUploadModalClosed();

    // ページが正常な状態であることを確認
    await expect(documentsPage.uploadButton).toBeVisible();
    await expect(documentsPage.filenameSearchInput).toBeVisible();
  });

  test("説明書を表示した状態でアップロードモーダルを開けること", async () => {
    // 説明書を表示
    const buttonText = await documentsPage.guideButton.textContent();
    if (buttonText?.includes("説明書")) {
      await documentsPage.toggleGuide();
    }
    await documentsPage.verifyGuideVisible();

    // アップロードモーダルを開く
    await documentsPage.clickUpload();
    await documentsPage.verifyUploadModalOpen();

    // モーダルを閉じる
    await documentsPage.closeUploadModal();

    // 説明書がまだ表示されていることを確認
    await documentsPage.verifyGuideVisible();
  });

  test("検索後に条件をクリアできること", async () => {
    // 検索を実行
    await documentsPage.filenameSearchInput.fill("test");
    await documentsPage.searchButton.click();
    await documentsPage.page.waitForLoadState("networkidle");

    // 検索条件をクリア
    await documentsPage.clearFilenameSearch();
    await expect(documentsPage.filenameSearchInput).toHaveValue("");
  });
});

// ============================================================================
// 4. パフォーマンス関連テスト
// ============================================================================
test.describe("Documents Page Performance", () => {
  let documentsPage: DocumentsPage;

  test.beforeEach(async ({ page }) => {
    documentsPage = new DocumentsPage(page);
  });

  test("ページの初回読み込みが10秒以内に完了すること", async ({ page }) => {
    const startTime = Date.now();
    await documentsPage.goto();
    await documentsPage.verifyPageLoaded();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
  });

  test("アップロードモーダルが1秒以内に開くこと", async () => {
    await documentsPage.goto();
    await documentsPage.verifyPageLoaded();

    const startTime = Date.now();
    await documentsPage.clickUpload();
    await documentsPage.verifyUploadModalOpen();
    const openTime = Date.now() - startTime;

    expect(openTime).toBeLessThan(1000);
  });
});
