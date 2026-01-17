import { expect, test } from "../base";
import { RegisterPage } from "../pom/RegisterPage";

test.use({ storageState: { cookies: [], origins: [] } });

/**
 * 登録ページのテスト
 */
test.describe("Register Page", () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test("登録ページの主要な要素が正しく表示されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    // タイトルとサブタイトルが表示されていることを確認
    await expect(registerPage.title).toBeVisible();
    await expect(registerPage.subtitle).toBeVisible();

    // フォーム要素が表示されていることを確認
    await expect(registerPage.nicknameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.registerButton).toBeVisible();

    // ログインリンクが表示されていることを確認
    await expect(registerPage.loginLink).toBeVisible();
  });

  test("必須項目が空の場合、登録ボタンが無効化されていること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    // ボタンが無効化されていることを確認
    await expect(registerPage.registerButton).toBeDisabled();
  });

  test("全ての必須項目を入力すると、登録ボタンが有効化されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    await registerPage.fillRegisterForm(
      "Test User",
      "test@example.com",
      "TestPassword123"
    );

    // ボタンが有効化されていることを確認
    await expect(registerPage.registerButton).toBeEnabled();
  });

  test("既に登録されているメールアドレスで登録しようとするとエラーメッセージが表示されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    // 既存のメールアドレスで登録を試みる
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    const testPassword = process.env.E2E_TEST_PASSWORD || "TestPassword123";
    await registerPage.fillRegisterForm("Test User", testEmail, testPassword);
    await registerPage.submitRegister();

    // エラーメッセージが表示されることを確認
    await expect(registerPage.errorAlert).toBeVisible({ timeout: 10000 });
  });

  test("登録フォーム送信後、確認コードフォームが表示されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    // 新規メールアドレスで登録を試みる
    const timestamp = Date.now();
    await registerPage.fillRegisterForm(
      "Test User",
      `test${timestamp}@example.com`,
      "TestPassword123"
    );
    await registerPage.submitRegister();

    // 確認コードフォームが表示されることを確認
    await registerPage.verifyConfirmFormLoaded({ timeout: 10000 });
  });

  test("確認コードフォームで戻るボタンをクリックすると登録フォームに戻ること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    // 登録を実行して確認コードフォームを表示
    const timestamp = Date.now();
    await registerPage.fillRegisterForm(
      "Test User",
      `test${timestamp}@example.com`,
      "TestPassword123"
    );
    await registerPage.submitRegister();
    await registerPage.verifyConfirmFormLoaded({ timeout: 10000 });

    // 戻るボタンをクリック
    await registerPage.goBackToRegister();

    // 登録フォームが表示されることを確認
    await registerPage.verifyRegisterFormLoaded();
  });

  test("ログインリンクをクリックするとログインページへ遷移すること", async ({
    page,
  }) => {
    await registerPage.verifyRegisterFormLoaded();

    await registerPage.clickLogin();

    await expect(page).toHaveURL(/.*\/login/);
  });

  test("無効な確認コードを入力するとエラーメッセージが表示されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    // 登録を実行して確認コードフォームを表示
    const timestamp = Date.now();
    await registerPage.fillRegisterForm(
      "Test User",
      `test${timestamp}@example.com`,
      "TestPassword123"
    );
    await registerPage.submitRegister();
    await registerPage.verifyConfirmFormLoaded({ timeout: 10000 });

    // 無効な確認コードを入力
    await registerPage.fillConfirmationCode("000000");
    await registerPage.submitConfirmation();

    // エラーメッセージが表示されることを確認
    await expect(registerPage.errorAlert).toBeVisible({ timeout: 10000 });
  });

  test("無効なメールアドレス形式でバリデーションエラーが表示されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    await registerPage.emailInput.fill("invalid-email");
    await registerPage.emailInput.blur();

    // registerSchema で定義されているメッセージに基づいて検証
    await registerPage.expectValidationError(
      "email",
      "有効なメールアドレスを入力してください"
    );
  });

  test("短すぎるパスワードでバリデーションエラーが表示されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    await registerPage.passwordInput.fill("short");
    await registerPage.passwordInput.blur();

    // registerSchema で定義されているメッセージに基づいて検証
    await registerPage.expectValidationError(
      "password",
      "パスワードは8文字以上である必要があります"
    );
  });

  test("数字を含まないパスワードでバリデーションエラーが表示されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    // 大文字を含むが数字を含まないパスワードを入力
    await registerPage.passwordInput.fill("Password");
    await registerPage.passwordInput.blur();

    // registerSchema で定義されているメッセージに基づいて検証
    await registerPage.expectValidationError(
      "password",
      "パスワードには数字を含める必要があります"
    );
  });

  test("大文字を含まないパスワードでバリデーションエラーが表示されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    // 数字を含むが大文字を含まないパスワードを入力
    await registerPage.passwordInput.fill("password123");
    await registerPage.passwordInput.blur();

    // registerSchema で定義されているメッセージに基づいて検証
    await registerPage.expectValidationError(
      "password",
      "パスワードには大文字を含める必要があります"
    );
  });

  test("記号を含まないパスワードでバリデーションエラーが表示されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    // 記号を含まないパスワードを入力
    await registerPage.passwordInput.fill("Password123");
    await registerPage.passwordInput.blur();

    // registerSchema で定義されているメッセージに基づいて検証
    await registerPage.expectValidationError(
      "password",
      "パスワードには記号(! @ # など)を含める必要があります"
    );
  });

  test("空のユーザー名でバリデーションエラーが表示されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    await registerPage.nicknameInput.fill("");
    await registerPage.nicknameInput.blur();

    // registerSchema で定義されているメッセージに基づいて検証
    await registerPage.expectValidationError(
      "nickname",
      "ユーザー名を入力してください"
    );
  });

  test("長すぎるユーザー名でバリデーションエラーが表示されること", async () => {
    await registerPage.verifyRegisterFormLoaded();

    const longNickname = "a".repeat(51); // 51文字（上限50文字を超える）
    await registerPage.nicknameInput.fill(longNickname);
    await registerPage.nicknameInput.blur();

    // registerSchema で定義されているメッセージに基づいて検証
    await registerPage.expectValidationError(
      "nickname",
      "ユーザー名は50文字以内で入力してください"
    );
  });
});
