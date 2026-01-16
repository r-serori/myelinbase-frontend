import { expect, type Locator, Page } from "@playwright/test";

/**
 * LoginPage のページオブジェクト
 * ログイン画面の要素と操作をカプセル化します。
 */
export class LoginPage {
  readonly page: Page;

  // 主要な要素
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly errorAlert: Locator;
  readonly errorToast: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;

    // セレクタの定義
    // src/app/login/page.tsx の実装に基づいています

    // タイトルとサブタイトル
    this.title = page.getByRole("heading", { name: "ログイン" });
    this.subtitle = page.getByText("アカウントにサインインしてください");

    // フォーム要素
    this.emailInput = page.getByLabel("メールアドレス");
    this.passwordInput = page.getByLabel("パスワード");
    this.loginButton = page.getByRole("button", { name: "ログイン" });

    // リンク
    this.forgotPasswordLink = page.getByRole("link", {
      name: "パスワードをお忘れですか？",
    });
    this.registerLink = page.getByRole("link", { name: "アカウント作成" });

    // エラー表示
    this.errorAlert = page.getByRole("alert").first();
    this.errorToast = page.getByRole("alertdialog").first();

    // ローディングスピナー
    this.loadingSpinner = page.getByRole("status").first();
  }

  /**
   * ページへの遷移
   */
  async goto() {
    await this.page.goto("/login");
  }

  /**
   * 基本的な表示確認
   */
  async verifyPageLoaded() {
    await expect(this.title).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * ログインを実行
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * パスワード忘れリンクをクリック
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * アカウント作成リンクをクリック
   */
  async clickRegister() {
    await this.registerLink.click();
  }

  /**
   * エラーメッセージが表示されることを確認
   */
  async expectErrorToast(message: string) {
    await expect(this.errorToast).toBeVisible();
    await expect(this.errorToast).toContainText(message);
  }

  /**
   * バリデーションエラーが表示されることを確認
   */
  async expectValidationError(field: "email" | "password", message: string) {
    const fieldLabel = field === "email" ? "メールアドレス" : "パスワード";
    const fieldContainer = this.page
      .getByLabel(fieldLabel)
      .locator("..")
      .locator("..");
    await expect(fieldContainer).toContainText(message);
  }
}
