import { expect, test } from "../base";
import { ProfilePage } from "../pom/ProfilePage";

/**
 * プロフィールページのテスト
 */

// ========== 1. 未認証ユーザー向けのテストグループ ==========
test.describe("Profile Page (Unauthenticated)", () => {
  // このブロック内のテストは、グローバル設定を無視して「未ログイン状態」で開始する
  test.use({ storageState: { cookies: [], origins: [] } });

  test("未認証ユーザーがアクセスするとログインページにリダイレクトされること", async ({
    page,
  }) => {
    // ページ遷移（beforeEachがないので直接移動）
    await page.goto("/profile");

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });
});

// ========== 2. 認証済みユーザー向けのテストグループ ==========
test.describe("Profile Page", () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  // ========== ページ表示と基本機能 ==========

  test("プロフィールページの主要な要素が正しく表示されること", async () => {
    await profilePage.verifyPageLoaded();

    // 上部
    await expect(profilePage.nicknameDisplay).toBeVisible();
    await expect(profilePage.emailDisplay).toBeVisible();
    await expect(profilePage.logoutButton).toBeVisible();

    // 基本情報部分
    await expect(profilePage.emailLabel).toBeVisible();
    await expect(profilePage.emailText).toBeVisible();
    await expect(profilePage.nicknameLabel).toBeVisible();
    await expect(profilePage.nicknameText).toBeVisible();
    await expect(profilePage.editNicknameButton).toBeVisible();
  });

  // ========== ニックネーム編集機能 ==========

  test("ニックネーム編集ボタンをクリックすると編集フォームが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.startEditingNickname();

    // 編集フォームが表示されることを確認
    await expect(profilePage.nicknameInput).toBeVisible();
    await expect(profilePage.saveNicknameButton).toBeVisible();
    await expect(profilePage.cancelNicknameButton).toBeVisible();
  });

  test("ニックネーム編集をキャンセルすると編集フォームが閉じること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.startEditingNickname();
    await profilePage.cancelEditingNickname();

    // 編集フォームが閉じることを確認
    await expect(profilePage.nicknameInput).not.toBeVisible();
  });

  // ========== パスワード変更機能 ==========

  test("パスワード変更ボタンをクリックするとパスワード変更フォームが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    // パスワード変更フォームが表示されることを確認
    await expect(profilePage.oldPasswordInput).toBeVisible();
    await expect(profilePage.newPasswordInput).toBeVisible();
    await expect(profilePage.confirmNewPasswordInput).toBeVisible();
  });

  test("パスワード変更フォームで全ての必須項目が空の場合、変更ボタンが無効化されていること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    // ボタンが無効化されていることを確認
    await expect(profilePage.changePasswordSubmitButton).toBeDisabled();
  });

  test("パスワード変更フォームで全ての必須項目を入力すると、変更ボタンが有効化されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    await profilePage.oldPasswordInput.fill("OldPassword123");
    await profilePage.newPasswordInput.fill("NewPassword123");
    await profilePage.confirmNewPasswordInput.fill("NewPassword123");

    // ボタンが有効化されていることを確認
    await expect(profilePage.changePasswordSubmitButton).toBeEnabled();
  });

  // ========== ニックネーム編集の詳細テスト ==========

  test("ニックネームが空の場合、保存ボタンが無効化されていること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.startEditingNickname();
    await profilePage.nicknameInput.fill("");

    // 保存ボタンが無効化されていることを確認
    await expect(profilePage.saveNicknameButton).toBeDisabled();
  });

  test("ニックネームが変更されていない場合、保存ボタンが無効化されていること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.startEditingNickname();

    // 現在のニックネームと同じ値の場合、保存ボタンが無効化されていることを確認
    // （編集開始時は現在の値が入力されているため、変更がない場合は無効化される）
    await expect(profilePage.saveNicknameButton).toBeDisabled();
  });

  test("ニックネームが空文字の場合、バリデーションエラーが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.startEditingNickname();
    await profilePage.nicknameInput.fill("");
    await profilePage.nicknameInput.blur();

    // バリデーションエラーが表示されることを確認
    await profilePage.expectFieldError(
      "ユーザー名",
      "ユーザー名を入力してください"
    );
  });

  test("ニックネームが50文字を超える場合、バリデーションエラーが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.startEditingNickname();
    const longNickname = "a".repeat(51);
    await profilePage.nicknameInput.fill(longNickname);
    await profilePage.nicknameInput.blur();

    // バリデーションエラーが表示されることを確認
    await profilePage.expectFieldError(
      "ユーザー名",
      "ユーザー名は50文字以内で入力してください"
    );
  });

  test("ニックネーム編集時に空白のみを入力した場合、保存ボタンが無効化されていること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.startEditingNickname();
    await profilePage.nicknameInput.fill("   ");

    // 保存ボタンが無効化されていることを確認（trim()で空文字になるため）
    await expect(profilePage.saveNicknameButton).toBeDisabled();
  });

  // ========== パスワード変更の詳細テスト ==========

  test("パスワード変更フォームを閉じることができること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();
    await profilePage.closeChangePasswordForm();

    // フォームが閉じることを確認
    await expect(profilePage.oldPasswordInput).not.toBeVisible();
  });

  test("パスワード変更フォームでキャンセルボタンをクリックするとフォームが閉じること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();
    await profilePage.cancelChangePassword();

    // フォームが閉じることを確認
    await expect(profilePage.oldPasswordInput).not.toBeVisible();
  });

  test("現在のパスワードが空の場合、変更ボタンが無効化されていること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    await profilePage.newPasswordInput.fill("NewPassword123");
    await profilePage.confirmNewPasswordInput.fill("NewPassword123");

    // 変更ボタンが無効化されていることを確認
    await expect(profilePage.changePasswordSubmitButton).toBeDisabled();
  });

  test("新しいパスワードが空の場合、変更ボタンが無効化されていること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    await profilePage.oldPasswordInput.fill("OldPassword123");
    await profilePage.confirmNewPasswordInput.fill("NewPassword123");

    // 変更ボタンが無効化されていることを確認
    await expect(profilePage.changePasswordSubmitButton).toBeDisabled();
  });

  test("確認用パスワードが空の場合、変更ボタンが無効化されていること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    await profilePage.oldPasswordInput.fill("OldPassword123");
    await profilePage.newPasswordInput.fill("NewPassword123");

    // 変更ボタンが無効化されていることを確認
    await expect(profilePage.changePasswordSubmitButton).toBeDisabled();
  });

  test("パスワードが8文字未満の場合、バリデーションエラーが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    await profilePage.newPasswordInput.fill("Short1");
    await profilePage.newPasswordInput.blur();

    // バリデーションエラーが表示されることを確認
    await profilePage.expectFieldError(
      "新しいパスワード",
      "新しいパスワードは8文字以上である必要があります"
    );
  });

  test("パスワードに数字が含まれていない場合、バリデーションエラーが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    await profilePage.newPasswordInput.fill("NoNumberA");
    await profilePage.newPasswordInput.blur();

    // バリデーションエラーが表示されることを確認
    await profilePage.expectFieldError(
      "新しいパスワード",
      "新しいパスワードには数字を含める必要があります"
    );
  });

  test("パスワードに大文字が含まれていない場合、バリデーションエラーが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    await profilePage.newPasswordInput.fill("nouppercase1");
    await profilePage.newPasswordInput.blur();

    // バリデーションエラーが表示されることを確認
    await profilePage.expectFieldError(
      "新しいパスワード",
      "新しいパスワードには大文字を含める必要があります"
    );
  });

  test("新しいパスワードと確認用パスワードが一致しない場合、バリデーションエラーが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    await profilePage.oldPasswordInput.fill("OldPassword123");
    await profilePage.newPasswordInput.fill("NewPassword123");
    await profilePage.confirmNewPasswordInput.fill("Different123");
    await profilePage.confirmNewPasswordInput.blur();
    await profilePage.changePasswordSubmitButton.click();

    // バリデーションエラーが表示されることを確認
    await profilePage.expectFieldError(
      "確認用入力",
      "確認用パスワードが一致しません"
    );
  });

  test("現在のパスワードが8文字未満の場合、バリデーションエラーが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    await profilePage.oldPasswordInput.fill("Short1");
    await profilePage.oldPasswordInput.blur();

    // バリデーションエラーが表示されることを確認
    await profilePage.expectFieldError(
      "現在のパスワード",
      "パスワードは8文字以上である必要があります"
    );
  });

  test("現在のパスワードに数字が含まれていない場合、バリデーションエラーが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    await profilePage.oldPasswordInput.fill("NoNumberA");
    await profilePage.oldPasswordInput.blur();

    // バリデーションエラーが表示されることを確認
    await profilePage.expectFieldError(
      "現在のパスワード",
      "パスワードには数字を含める必要があります"
    );
  });

  test("現在のパスワードに大文字が含まれていない場合、バリデーションエラーが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.openChangePasswordForm();

    await profilePage.oldPasswordInput.fill("nouppercase1");
    await profilePage.oldPasswordInput.blur();

    // バリデーションエラーが表示されることを確認
    await profilePage.expectFieldError(
      "現在のパスワード",
      "パスワードには大文字を含める必要があります"
    );
  });

  // ========== ログアウト機能 ==========

  test("ログアウトボタンをクリックすると確認モーダルが表示されること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.logoutButton.click();

    // 確認モーダルが表示されることを確認
    await expect(profilePage.logoutModal).toBeVisible();
    await expect(profilePage.logoutConfirmButton).toBeVisible();
    await expect(profilePage.logoutCancelButton).toBeVisible();
  });

  test("ログアウト確認モーダルでキャンセルをクリックするとモーダルが閉じること", async () => {
    await profilePage.verifyPageLoaded();

    await profilePage.cancelLogout();

    // モーダルが閉じることを確認
    await expect(profilePage.logoutModal).not.toBeVisible();
  });

  test("ログアウトを実行するとログインページに遷移すること", async ({
    page,
  }) => {
    await profilePage.verifyPageLoaded();

    await profilePage.logout();

    // ログインページに遷移することを確認
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });
});
