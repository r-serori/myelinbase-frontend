import { expect, test } from "../base";
import { LoginPage } from "../pom/LoginPage";

test.use({ storageState: { cookies: [], origins: [] } });

/**
 * ログインページのテスト
 */
test.describe("Login Page", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("ログインページの主要な要素が正しく表示されること", async () => {
    await loginPage.verifyPageLoaded();

    // タイトルとサブタイトルが表示されていることを確認
    await expect(loginPage.title).toBeVisible();
    await expect(loginPage.subtitle).toBeVisible();

    // フォーム要素が表示されていることを確認
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    // リンクが表示されていることを確認
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test("メールアドレスとパスワードが空の場合、ログインボタンが無効化されていること", async () => {
    await loginPage.verifyPageLoaded();

    // ボタンが無効化されていることを確認
    await expect(loginPage.loginButton).toBeDisabled();
  });

  test("メールアドレスとパスワードを入力すると、ログインボタンが有効化されること", async () => {
    await loginPage.verifyPageLoaded();

    await loginPage.emailInput.fill("test@example.com");
    await loginPage.passwordInput.fill("TestPassword123");

    // ボタンが有効化されていることを確認
    await expect(loginPage.loginButton).toBeEnabled();
  });

  test("無効なメールアドレス形式でバリデーションエラーが表示されること", async () => {
    await loginPage.verifyPageLoaded();

    await loginPage.emailInput.fill("invalid-email");
    await loginPage.emailInput.blur();

    // loginSchema で定義されているメッセージに基づいて検証
    await loginPage.expectValidationError(
      "email",
      "有効なメールアドレスを入力してください"
    );
  });

  test("無効なパスワード形式でバリデーションエラーが表示されること", async () => {
    await loginPage.verifyPageLoaded();

    await loginPage.passwordInput.fill("inva");
    await loginPage.passwordInput.blur();

    // loginSchema で定義されているメッセージに基づいて検証
    await loginPage.expectValidationError(
      "password",
      "パスワードは8文字以上である必要があります"
    );
  });

  test("記号を含まないパスワードでバリデーションエラーが表示されること", async () => {
    await loginPage.verifyPageLoaded();

    // 記号を含まないパスワードを入力
    await loginPage.passwordInput.fill("Password123");
    await loginPage.passwordInput.blur();

    // registerSchema で定義されているメッセージに基づいて検証
    await loginPage.expectValidationError(
      "password",
      "パスワードには記号(! @ # など)を含める必要があります"
    );
  });

  test("パスワード忘れリンクをクリックするとパスワード忘れページへ遷移すること", async ({
    page,
  }) => {
    await loginPage.verifyPageLoaded();

    await loginPage.clickForgotPassword();

    await expect(page).toHaveURL(/.*\/forgot-password/);
  });

  test("アカウント作成リンクをクリックすると登録ページへ遷移すること", async ({
    page,
  }) => {
    await loginPage.verifyPageLoaded();

    await loginPage.clickRegister();

    await expect(page).toHaveURL(/.*\/register/);
  });

  test("存在しないユーザーでログインしようとするとエラーメッセージが表示されること", async () => {
    await loginPage.verifyPageLoaded();

    await loginPage.login("nonexistent@example.com", "TestPassword_123");

    // エラーメッセージが表示されることを確認
    // 実際のエラーメッセージに合わせて調整してください
    await loginPage.expectErrorToast(
      "ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。"
    );
  });

  test("間違ったパスワードでログインしようとするとエラーメッセージが表示されること", async () => {
    await loginPage.verifyPageLoaded();

    // 既存ユーザーで間違ったパスワードを入力
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    await loginPage.login(testEmail, "WrongPassword_123");

    // エラーメッセージが表示されることを確認
    await loginPage.expectErrorToast(
      "ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。"
    );
  });

  test("正しい認証情報でログインすると、ドキュメントページにリダイレクトされること", async ({
    page,
  }) => {
    await loginPage.verifyPageLoaded();

    // 既存ユーザーで正しい認証情報を入力
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    const testPassword = process.env.E2E_TEST_PASSWORD || "TestPassword_123";
    await loginPage.login(testEmail, testPassword);

    // ログイン成功後、ドキュメントページまたはチャットページにリダイレクトされることを確認
    await page.waitForURL(/.*(\/documents|\/chat)/, { timeout: 10000 });
    // エラーメッセージが表示されていないことを確認
    await expect(loginPage.errorToast).not.toBeVisible();
  });
});
