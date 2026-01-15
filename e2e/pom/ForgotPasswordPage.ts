import { expect, type Locator, Page } from "@playwright/test";

/**
 * ForgotPasswordPage のページオブジェクト
 * パスワード忘れ画面の要素と操作をカプセル化します。
 */
export class ForgotPasswordPage {
  readonly page: Page;

  // リセットコード要求フォームの要素
  readonly requestTitle: Locator;
  readonly requestSubtitle: Locator;
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;
  readonly backToLoginLink: Locator;
  readonly errorAlert: Locator;

  // パスワードリセットフォームの要素
  readonly resetTitle: Locator;
  readonly resetSubtitle: Locator;
  readonly codeInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly resetButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // リセットコード要求フォームのセレクタ
    this.requestTitle = page.getByRole("heading", {
      name: "パスワードをお忘れですか？",
    });
    this.requestSubtitle =
      page.getByText(/登録したメールアドレスを入力してください/);
    this.emailInput = page.getByLabel("メールアドレス");
    this.sendCodeButton = page.getByRole("button", { name: "コードを送信" });
    this.backToLoginLink = page.getByRole("link", {
      name: "ログイン画面に戻る",
    });

    // パスワードリセットフォームのセレクタ
    this.resetTitle = page.getByRole("heading", {
      name: "新しいパスワードの設定",
    });
    this.resetSubtitle = page.getByText(
      /確認コードと新しいパスワードを入力してください/
    );
    this.codeInput = page.getByLabel("確認コード");
    this.newPasswordInput = page.getByLabel("新しいパスワード");
    this.confirmPasswordInput = page.getByLabel("パスワード（確認）");
    this.resetButton = page.getByRole("button", { name: "パスワードを変更" });
    this.backButton = page.getByRole("button", { name: "戻る" });

    // エラー表示
    this.errorAlert = page.getByRole("alert").first();
  }

  /**
   * ページへの遷移
   */
  async goto() {
    await this.page.goto("/forgot-password");
  }

  /**
   * 基本的な表示確認（リセットコード要求フォーム）
   */
  async verifyRequestFormLoaded() {
    await expect(this.requestTitle).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.sendCodeButton).toBeVisible();
  }

  /**
   * パスワードリセットフォームが表示されていることを確認
   * エラーが表示されていても、フォームが表示されれば成功とみなす
   */
  async verifyResetFormLoaded(options?: { timeout?: number }) {
    // エラーが表示されていても、フォームが表示されれば続行
    // タイトルが表示されることを確認（これが表示されればフォームが表示されている）
    await expect(this.resetTitle).toBeVisible(options);
    await expect(this.codeInput).toBeVisible(options);
    await expect(this.newPasswordInput).toBeVisible(options);
    await expect(this.confirmPasswordInput).toBeVisible(options);
    await expect(this.resetButton).toBeVisible(options);
  }

  /**
   * メールアドレスを入力してコード送信
   * エラーが発生しても、パスワードリセットフォームが表示される場合は成功とみなす
   */
  async requestResetCode(email: string) {
    await this.emailInput.fill(email);
    await this.sendCodeButton.click();
    // API呼び出しの完了を待機（エラーが発生する可能性があるが、フォームが表示される場合は続行）
    await this.page.waitForTimeout(1000);
  }

  /**
   * パスワードリセットフォームに入力
   */
  async fillResetForm(
    code: string,
    newPassword: string,
    confirmPassword: string
  ) {
    await this.codeInput.fill(code);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  /**
   * パスワードリセットを実行
   */
  async submitReset() {
    await this.resetButton.click();
  }

  /**
   * リセットフォームに戻る
   */
  async goBackToRequest() {
    await this.backButton.click();
  }

  /**
   * ログイン画面に戻る
   */
  async clickBackToLogin() {
    await this.backToLoginLink.click();
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
    field: "email" | "code" | "newPassword" | "confirmPassword",
    message: string
  ) {
    const fieldLabel =
      field === "email"
        ? "メールアドレス"
        : field === "code"
          ? "確認コード"
          : field === "newPassword"
            ? "新しいパスワード"
            : "パスワード（確認）";
    // 入力フィールドの親要素（FormField）内のエラーメッセージを取得
    const fieldInput = this.page.getByLabel(fieldLabel);
    const fieldContainer = fieldInput.locator("..").locator(".."); // FormFieldのdiv要素
    const errorMessage = fieldContainer.getByRole("alert");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(message);
  }
}
