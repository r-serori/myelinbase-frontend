import { expect, type Locator, type Page } from "@playwright/test";

/**
 * LandingPage (Title画面) のページオブジェクト
 * 画面内の要素と操作をカプセル化します。
 */
export class LandingPage {
  readonly page: Page;

  // 主要な要素
  readonly title: Locator;
  readonly getStartedButton: Locator;
  readonly systemOnlineBadge: Locator;
  readonly clickScreenHint: Locator;

  constructor(page: Page) {
    this.page = page;

    // セレクタの定義
    // src/app/page.tsx の実装に基づいています

    // タイトル: "Myelin Base"
    this.title = page.getByText("Myelin Base");

    // Get Startedボタン（ボタン要素）
    this.getStartedButton = page.getByRole("button", { name: /Get Started/i });

    // System Onlineバッジ
    this.systemOnlineBadge = page.getByText("System Online");

    // クリックヒント
    this.clickScreenHint = page.getByText("Click Screen!");
  }

  /**
   * ページへの遷移
   */
  async goto() {
    await this.page.goto("/");
  }

  /**
   * 基本的な表示確認
   * アニメーション完了を待機してから要素の表示を確認します
   */
  async verifyPageLoaded() {
    // アニメーション完了を待機（SHOW_TITLEフェーズまで）
    // タイトルが表示されるまで待機（最大3秒）
    await expect(this.title).toBeVisible({ timeout: 5000 });

    // Get Startedボタンが表示されるまで待機
    await expect(this.getStartedButton).toBeVisible({ timeout: 5000 });

    // System Onlineバッジが表示されるまで待機
    await expect(this.systemOnlineBadge).toBeVisible({ timeout: 5000 });
  }

  /**
   * Get Startedボタンをクリック
   */
  async clickGetStarted() {
    await this.getStartedButton.click();
  }
}
