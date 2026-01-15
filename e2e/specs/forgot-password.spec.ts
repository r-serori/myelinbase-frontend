import { expect, test } from "../base";
import { ForgotPasswordPage } from "../pom/ForgotPasswordPage";

/**
 * パスワード忘れページのテスト
 */
test.describe("Forgot Password Page", () => {
  let forgotPasswordPage: ForgotPasswordPage;

  test.beforeEach(async ({ page }) => {
    forgotPasswordPage = new ForgotPasswordPage(page);
    await forgotPasswordPage.goto();
  });

  test("パスワード忘れページの主要な要素が正しく表示されること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    // タイトルとサブタイトルが表示されていることを確認
    await expect(forgotPasswordPage.requestTitle).toBeVisible();
    await expect(forgotPasswordPage.requestSubtitle).toBeVisible();

    // フォーム要素が表示されていることを確認
    await expect(forgotPasswordPage.emailInput).toBeVisible();
    await expect(forgotPasswordPage.sendCodeButton).toBeVisible();

    // ログイン画面に戻るリンクが表示されていることを確認
    await expect(forgotPasswordPage.backToLoginLink).toBeVisible();
  });

  test("メールアドレスが空の場合、送信ボタンが無効化されていること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    // ボタンが無効化されていることを確認
    await expect(forgotPasswordPage.sendCodeButton).toBeDisabled();
  });

  test("メールアドレスを入力すると、送信ボタンが有効化されること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    await forgotPasswordPage.emailInput.fill("test@example.com");

    // ボタンが有効化されていることを確認
    await expect(forgotPasswordPage.sendCodeButton).toBeEnabled();
  });

  test("存在しないメールアドレスでコード送信しようとするとエラーメッセージが表示されること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    await forgotPasswordPage.requestResetCode("nonexistent@example.com");

    // エラーメッセージが表示されることを確認
    await expect(forgotPasswordPage.errorAlert).toBeVisible({ timeout: 10000 });
  });

  test("コード送信後、パスワードリセットフォームが表示されること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    // 既存のメールアドレスでコード送信を試みる
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    await forgotPasswordPage.requestResetCode(testEmail);

    // パスワードリセットフォームが表示されることを確認
    await forgotPasswordPage.verifyResetFormLoaded({ timeout: 10000 });
  });

  test("パスワードリセットフォームで戻るボタンをクリックするとリセットコード要求フォームに戻ること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    // コード送信を実行してパスワードリセットフォームを表示
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    await forgotPasswordPage.requestResetCode(testEmail);
    await forgotPasswordPage.verifyResetFormLoaded({ timeout: 10000 });

    // 戻るボタンをクリック
    await forgotPasswordPage.goBackToRequest();

    // リセットコード要求フォームが表示されることを確認
    await forgotPasswordPage.verifyRequestFormLoaded();
  });

  test("ログイン画面に戻るリンクをクリックするとログインページへ遷移すること", async ({
    page,
  }) => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    await forgotPasswordPage.clickBackToLogin();

    await expect(page).toHaveURL(/.*\/login/);
  });

  test("パスワードリセットフォームで全ての必須項目が空の場合、変更ボタンが無効化されていること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    // コード送信を実行してパスワードリセットフォームを表示
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    await forgotPasswordPage.requestResetCode(testEmail);
    await forgotPasswordPage.verifyResetFormLoaded({ timeout: 10000 });

    // ボタンが無効化されていることを確認
    await expect(forgotPasswordPage.resetButton).toBeDisabled();
  });

  test("無効な確認コードでパスワードリセットしようとするとエラーメッセージが表示されること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    // コード送信を実行してパスワードリセットフォームを表示
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    await forgotPasswordPage.requestResetCode(testEmail);
    await forgotPasswordPage.verifyResetFormLoaded({ timeout: 10000 });

    // 無効な確認コードを入力（パスワードは大文字と数字を含む）
    await forgotPasswordPage.fillResetForm(
      "000000",
      "NewPassword123",
      "NewPassword123"
    );
    await forgotPasswordPage.submitReset();

    // エラーメッセージが表示されることを確認
    await expect(forgotPasswordPage.errorAlert).toBeVisible({ timeout: 10000 });
  });

  test("新しいパスワードと確認パスワードが一致しない場合、バリデーションエラーが表示されること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    // コード送信を実行してパスワードリセットフォームを表示
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    await forgotPasswordPage.requestResetCode(testEmail);
    await forgotPasswordPage.verifyResetFormLoaded({ timeout: 10000 });

    // パスワードが一致しない状態で入力（数字と大文字を含む適切なパスワードを使用）
    await forgotPasswordPage.codeInput.fill("123456");
    await forgotPasswordPage.newPasswordInput.fill("NewPassword123");
    await forgotPasswordPage.newPasswordInput.blur();
    // 新しいパスワードのバリデーションが完了するまで少し待機
    await forgotPasswordPage.page.waitForTimeout(100);
    await forgotPasswordPage.confirmPasswordInput.fill("DifferentPassword123");
    await forgotPasswordPage.confirmPasswordInput.blur();

    await forgotPasswordPage.submitReset();

    // resetPasswordSchema で定義されているメッセージに基づいて検証
    await forgotPasswordPage.expectValidationError(
      "confirmPassword",
      "確認用パスワードが一致しません"
    );
  });

  test("無効なメールアドレス形式でバリデーションエラーが表示されること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    await forgotPasswordPage.emailInput.fill("invalid-email");
    await forgotPasswordPage.emailInput.blur();

    // forgotPasswordSchema で定義されているメッセージに基づいて検証
    await forgotPasswordPage.expectValidationError(
      "email",
      "有効なメールアドレスを入力してください"
    );
  });

  test("短すぎる新しいパスワードでバリデーションエラーが表示されること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    // コード送信を実行してパスワードリセットフォームを表示
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    await forgotPasswordPage.requestResetCode(testEmail);
    await forgotPasswordPage.verifyResetFormLoaded({ timeout: 10000 });

    await forgotPasswordPage.newPasswordInput.fill("short");
    await forgotPasswordPage.newPasswordInput.blur();

    // resetPasswordSchema で定義されているメッセージに基づいて検証
    await forgotPasswordPage.expectValidationError(
      "newPassword",
      "パスワードは8文字以上である必要があります"
    );
  });

  test("数字を含まない新しいパスワードでバリデーションエラーが表示されること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    // コード送信を実行してパスワードリセットフォームを表示
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    await forgotPasswordPage.requestResetCode(testEmail);
    await forgotPasswordPage.verifyResetFormLoaded({ timeout: 10000 });

    // 大文字を含むが数字を含まないパスワードを入力
    await forgotPasswordPage.newPasswordInput.fill("Password");
    await forgotPasswordPage.newPasswordInput.blur();

    // resetPasswordSchema で定義されているメッセージに基づいて検証
    await forgotPasswordPage.expectValidationError(
      "newPassword",
      "パスワードには数字を含める必要があります"
    );
  });

  test("大文字を含まない新しいパスワードでバリデーションエラーが表示されること", async () => {
    await forgotPasswordPage.verifyRequestFormLoaded();

    // コード送信を実行してパスワードリセットフォームを表示
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    await forgotPasswordPage.requestResetCode(testEmail);
    await forgotPasswordPage.verifyResetFormLoaded({ timeout: 10000 });

    // 数字を含むが大文字を含まないパスワードを入力
    await forgotPasswordPage.newPasswordInput.fill("password123");
    await forgotPasswordPage.newPasswordInput.blur();

    // resetPasswordSchema で定義されているメッセージに基づいて検証
    await forgotPasswordPage.expectValidationError(
      "newPassword",
      "パスワードには大文字を含める必要があります"
    );
  });
});
