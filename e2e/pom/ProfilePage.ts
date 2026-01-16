import { expect, type Locator, Page } from "@playwright/test";

/**
 * ProfilePage のページオブジェクト
 * プロフィール画面の要素と操作をカプセル化します。
 */
export class ProfilePage {
  readonly page: Page;

  // 上部
  readonly nicknameDisplay: Locator;
  readonly emailDisplay: Locator;
  readonly logoutButton: Locator;
  // 基本情報部分
  readonly emailLabel: Locator;
  readonly emailText: Locator;
  readonly nicknameLabel: Locator;
  readonly nicknameText: Locator;
  readonly nicknameInput: Locator;
  readonly editNicknameButton: Locator;
  readonly saveNicknameButton: Locator;
  readonly cancelNicknameButton: Locator;
  // パスワード変更部分
  readonly changePasswordButton: Locator;
  readonly oldPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmNewPasswordInput: Locator;
  readonly changePasswordSubmitButton: Locator;
  readonly logoutModal: Locator;
  readonly logoutConfirmButton: Locator;
  readonly logoutCancelButton: Locator;
  readonly errorAlert: Locator;
  readonly errorToast: Locator;
  // パスワード変更フォームのキャンセルボタン
  readonly changePasswordCancelButton: Locator;
  // ローディング状態
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;

    // プロフィール情報表示
    this.nicknameDisplay = page
      .getByText(process.env.E2E_TEST_NICKNAME || "")
      .first();
    this.emailDisplay = page
      .getByText(process.env.E2E_TEST_EMAIL || "")
      .first();

    // ログアウトボタン
    this.logoutButton = page.getByRole("button", { name: "ログアウト" });

    // 基本情報部分
    this.emailLabel = page.getByText("メールアドレス");
    this.emailText = page.getByText(process.env.E2E_TEST_EMAIL || "").nth(1);
    this.nicknameLabel = page.getByText("ユーザー名");
    this.nicknameText = page
      .getByText(process.env.E2E_TEST_NICKNAME || "")
      .nth(1);
    this.editNicknameButton = page.getByRole("button", {
      name: "ユーザー名を編集",
    });
    this.nicknameInput = page.getByPlaceholder("ユーザー名を入力");
    this.saveNicknameButton = page.getByRole("button", { name: "保存" });
    this.cancelNicknameButton = page
      .getByRole("button", {
        name: "キャンセル",
      })
      .first();

    // パスワード変更
    this.changePasswordButton = page.getByRole("button", {
      name: /変更する|閉じる/,
    });
    this.oldPasswordInput = page.getByLabel("現在のパスワード");
    this.newPasswordInput = page.getByLabel("新しいパスワード");
    this.confirmNewPasswordInput = page.getByLabel("確認用入力");
    this.changePasswordSubmitButton = page.getByRole("button", {
      name: "パスワードを変更",
    });

    // ログアウトモーダル
    this.logoutModal = page.getByRole("dialog", {
      name: "ログアウトしますか？",
    });
    this.logoutConfirmButton = page
      .getByRole("dialog", { name: "ログアウトしますか？" })
      .getByRole("button", { name: "ログアウト" });
    this.logoutCancelButton = page
      .getByRole("dialog", { name: "ログアウトしますか？" })
      .getByRole("button", { name: "キャンセル" });

    this.changePasswordCancelButton = page
      .getByRole("button", {
        name: "キャンセル",
      })
      .last();

    // エラー表示
    this.errorAlert = page.getByRole("alert").first();
    this.errorToast = page.getByRole("alertdialog").first();

    // ローディング状態
    this.loadingSpinner = page.getByRole("status").first();
  }

  /**
   * ページへの遷移
   * プロフィールページに直接遷移します
   */
  async goto() {
    await this.page.goto("/profile", { waitUntil: "networkidle" });
    // プロフィールページに遷移するまで待機（リダイレクトされる可能性があるため）
    await this.page.waitForURL(/.*\/profile/, { timeout: 10000 });
  }

  /**
   * 基本的な表示確認
   */
  async verifyPageLoaded() {
    await expect(this.nicknameDisplay).toBeVisible();
    await expect(this.emailDisplay).toBeVisible();
    await expect(this.logoutButton).toBeVisible();
  }

  /**
   * ニックネーム編集を開始
   */
  async startEditingNickname() {
    await this.editNicknameButton.click();
    await expect(this.nicknameInput).toBeVisible();
  }

  /**
   * ニックネームを更新
   */
  async updateNickname(newNickname: string) {
    await this.startEditingNickname();
    await this.nicknameInput.fill(newNickname);
    await this.saveNicknameButton.click();
  }

  /**
   * ニックネーム編集をキャンセル
   */
  async cancelEditingNickname() {
    await this.cancelNicknameButton.click();
  }

  /**
   * パスワード変更フォームを開く
   */
  async openChangePasswordForm() {
    const buttonText = await this.changePasswordButton.textContent();
    if (buttonText?.includes("変更する")) {
      await this.changePasswordButton.click();
    }
    await expect(this.oldPasswordInput).toBeVisible();
  }

  /**
   * パスワードを変更
   */
  async changePassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ) {
    await this.openChangePasswordForm();
    await this.oldPasswordInput.fill(oldPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmNewPasswordInput.fill(confirmPassword);
    await this.changePasswordSubmitButton.click();
  }

  /**
   * ログアウトを実行
   */
  async logout() {
    await this.logoutButton.click();
    await expect(this.logoutModal).toBeVisible();
    await this.logoutConfirmButton.click();
  }

  /**
   * ログアウトをキャンセル
   */
  async cancelLogout() {
    await this.logoutButton.click();
    await expect(this.logoutModal).toBeVisible();
    await this.logoutCancelButton.click();
  }

  /**
   * エラーメッセージが表示されることを確認
   */
  async expectError(message: string) {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText(message);
  }

  /**
   * フィールドのバリデーションエラーを取得
   */
  async getFieldError(fieldLabel: string): Promise<Locator> {
    const fieldContainer = this.page
      .getByText(fieldLabel)
      .locator("..")
      .locator("..");
    return fieldContainer.getByRole("alert").first();
  }

  /**
   * フィールドのバリデーションエラーが表示されることを確認
   */
  async expectFieldError(fieldLabel: string, errorMessage: string) {
    const errorLocator = await this.getFieldError(fieldLabel);
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toContainText(errorMessage);
  }

  /**
   * トーストメッセージが表示されることを確認
   */
  async expectToast(message: string, type?: "success" | "error") {
    await expect(this.errorToast).toBeVisible();
    await expect(this.errorToast).toContainText(message);
  }

  /**
   * ローディング状態が表示されることを確認
   */
  async expectLoading() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  /**
   * ローディング状態が非表示になることを確認
   */
  async expectNotLoading() {
    await expect(this.loadingSpinner).not.toBeVisible();
  }

  /**
   * パスワード変更フォームを閉じる
   */
  async closeChangePasswordForm() {
    const buttonText = await this.changePasswordButton.textContent();
    if (buttonText?.includes("閉じる")) {
      await this.changePasswordButton.click();
    }
    await expect(this.oldPasswordInput).not.toBeVisible();
  }

  /**
   * パスワード変更フォームをキャンセル
   */
  async cancelChangePassword() {
    await this.changePasswordCancelButton.click();
    await expect(this.oldPasswordInput).not.toBeVisible();
  }

  /**
   * ニックネームが更新されたことを確認
   */
  async expectNicknameUpdated(newNickname: string) {
    await expect(this.nicknameDisplay).toContainText(newNickname);
    await expect(this.nicknameText).toContainText(newNickname);
  }
}
