import { expect, test } from "../base";
import { LandingPage } from "../pom/LandingPage";

/**
 * Title画面 (Landing Page) のテスト
 */
test.describe("Landing Page (Title Screen)", () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    // テスト前にページオブジェクトを初期化し、LPへ移動
    landingPage = new LandingPage(page);
    await landingPage.goto();
  });

  test("LPの主要な要素が正しく表示されること", async () => {
    // ページロード確認（アニメーション完了を待機）
    await landingPage.verifyPageLoaded();

    // タイトルが表示されていることを確認
    await expect(landingPage.title).toBeVisible();

    // ボタンが有効化されているか（disabledでないか）
    await expect(landingPage.getStartedButton).toBeEnabled();

    // System Onlineバッジが表示されていることを確認
    await expect(landingPage.systemOnlineBadge).toBeVisible();
  });

  test("Get Startedボタンをクリックするとログインページまたはチャットページへ遷移すること", async ({
    page,
  }) => {
    // アニメーション完了を待機
    await landingPage.verifyPageLoaded();

    // クリックアクション
    await landingPage.clickGetStarted();

    // 遷移先のURL確認
    // 未ログインの場合は /login、ログイン済みの場合は /chat に遷移
    await expect(page).toHaveURL(/.*(\/login|\/chat)/);
  });

  test("ページタイトルが正しく表示されること", async () => {
    await landingPage.verifyPageLoaded();

    // タイトルテキストの確認
    await expect(landingPage.title).toHaveText("Myelin Base");
  });

  test("アニメーションが完了するとクリックヒントが表示されること", async () => {
    // アニメーション完了を待機
    await landingPage.verifyPageLoaded();

    // クリックヒントが表示されることを確認
    await expect(landingPage.clickScreenHint).toBeVisible();
  });
});
