import { expect, type Locator, type Page } from "@playwright/test";

/**
 * RegisterPage のページオブジェクト
 * 登録画面の要素と操作をカプセル化します。
 */
export class RegisterPage {
  readonly page: Page;

  // 登録フォームの要素
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly nicknameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly registerButton: Locator;
  readonly loginLink: Locator;
  readonly errorAlert: Locator;
  readonly errorToast: Locator;

  // 確認コードフォームの要素
  readonly confirmTitle: Locator;
  readonly confirmSubtitle: Locator;
  readonly codeInput: Locator;
  readonly confirmButton: Locator;
  readonly resendCodeButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // 登録フォームのセレクタ
    this.title = page.getByRole("heading", { name: "アカウント作成" });
    this.subtitle = page.getByText("新しいアカウントを作成して始めましょう");

    this.nicknameInput = page.getByLabel("ユーザー名");
    this.emailInput = page.getByLabel("メールアドレス");
    this.passwordInput = page.getByLabel("パスワード");
    this.registerButton = page.getByRole("button", { name: "アカウント作成" });
    this.loginLink = page.getByRole("link", { name: "ログイン" });

    // 確認コードフォームのセレクタ
    this.confirmTitle = page.getByRole("heading", {
      name: "メールアドレスの確認",
    });
    this.confirmSubtitle =
      page.getByText(/に送信された確認コードを入力してください/);
    this.codeInput = page.getByLabel("確認コード");
    this.confirmButton = page.getByRole("button", {
      name: "アカウントを有効化",
    });
    this.resendCodeButton = page.getByRole("button", {
      name: "コードを再送信",
    });
    this.backButton = page.getByRole("button", { name: "戻る" });

    // エラー表示
    this.errorAlert = page.getByRole("alert").first();
    this.errorToast = page.getByRole("alertdialog").first();
  }

  /**
   * ページへの遷移
   */
  async goto() {
    await this.page.goto("/register");
  }

  /**
   * 基本的な表示確認（登録フォーム）
   */
  async verifyRegisterFormLoaded() {
    await expect(this.title).toBeVisible();
    await expect(this.nicknameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /**
   * 確認コードフォームが表示されていることを確認
   */
  async verifyConfirmFormLoaded(options?: { timeout?: number }) {
    await expect(this.confirmTitle).toBeVisible(options);
    await expect(this.codeInput).toBeVisible(options);
    await expect(this.confirmButton).toBeVisible(options);
  }

  /**
   * 登録フォームに入力
   */
  async fillRegisterForm(nickname: string, email: string, password: string) {
    await this.nicknameInput.fill(nickname);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * 登録を実行
   */
  async submitRegister() {
    await this.registerButton.click();
  }

  /**
   * 確認コードを入力
   */
  async fillConfirmationCode(code: string) {
    await this.codeInput.fill(code);
  }

  /**
   * 確認コードを送信
   */
  async submitConfirmation() {
    await this.confirmButton.click();
  }

  /**
   * コードを再送信
   */
  async resendCode() {
    await this.resendCodeButton.click();
  }

  /**
   * 登録フォームに戻る
   */
  async goBackToRegister() {
    await this.backButton.click();
  }

  /**
   * ログインリンクをクリック
   */
  async clickLogin() {
    await this.loginLink.click();
  }

  /**
   * エラーメッセージが表示されることを確認
   */
  async expectError(message: string) {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText(message);
  }

  /**
   * バリデーションエラーが表示されることを確認
   */
  async expectValidationError(
    field: "nickname" | "email" | "password",
    message: string
  ) {
    const fieldLabel =
      field === "nickname"
        ? "ユーザー名"
        : field === "email"
          ? "メールアドレス"
          : "パスワード";
    // 入力フィールドの親要素（FormField）内のエラーメッセージを取得
    const fieldInput = this.page.getByLabel(fieldLabel);
    const fieldContainer = fieldInput.locator("..").locator(".."); // FormFieldのdiv要素
    const errorMessage = fieldContainer.getByRole("alert");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(message);
  }
}
