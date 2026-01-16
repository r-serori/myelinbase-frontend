import { type BrowserContext, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

import { LoginPage } from "../pom/LoginPage";

/**
 * 認証ヘルパー
 * テスト用の認証状態を管理します
 * Playwrightのベストプラクティスに基づいて、storageStateを使用します
 */
export class AuthHelper {
  private static readonly STORAGE_STATE_PATH = path.join(
    __dirname,
    "../.auth/storage-state.json"
  );

  /**
   * ログイン状態をシミュレート
   */
  static async loginAsMockUser(page: Page) {
    // 実際の環境では、ログインフローを実行
    // 注意: 実際のテスト環境では、テスト用ユーザーの認証情報が必要です
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // テスト用の認証情報（環境変数から取得するか、デフォルト値を使用）
    const testEmail = process.env.E2E_TEST_EMAIL || "test@example.com";
    const testPassword = process.env.E2E_TEST_PASSWORD || "TestPassword123";

    await loginPage.login(testEmail, testPassword);

    // ログイン成功を待機（/documents または /chat にリダイレクトされることを確認）
    try {
      await page.waitForURL(/.*(\/documents)/, { timeout: 15000 });
      // エラーメッセージが表示されていないことを確認
      const errorToast = page.getByRole("alertdialog").first();
      const isErrorVisible = await errorToast.isVisible().catch(() => false);
      if (isErrorVisible) {
        const errorText = await errorToast.textContent();
        throw new Error(
          `ログインに失敗しました: ${errorText || "エラーメッセージが表示されています"}`
        );
      }
    } catch (error) {
      // ログインページに留まっている場合は、ログインが失敗したことを示す
      if (page.url().includes("/login")) {
        const errorToast = page.getByRole("alertdialog").first();
        const errorText = await errorToast
          .textContent()
          .catch(() => "不明なエラー");
        throw new Error(`ログインに失敗しました。エラー: ${errorText}`);
      }
      throw error;
    }
  }

  /**
   * 認証が必要なページにアクセスする前に認証状態を確認
   * storageStateが存在する場合はそれを使用し、存在しない場合はログインを実行
   */
  static async ensureAuthenticated(
    context: BrowserContext,
    page: Page
  ): Promise<void> {
    // storageStateが存在する場合は、それを使用して認証状態を復元
    if (fs.existsSync(this.STORAGE_STATE_PATH)) {
      try {
        const storageState = JSON.parse(
          fs.readFileSync(this.STORAGE_STATE_PATH, "utf-8")
        );
        await context.addCookies(storageState.cookies || []);
        if (storageState.origins?.[0]?.localStorage) {
          await context.addInitScript((storage) => {
            if (storage.localStorage) {
              for (const [key, value] of Object.entries(storage.localStorage)) {
                window.localStorage.setItem(key, value as string);
              }
            }
          }, storageState.origins[0].localStorage);
        }
      } catch {
        // storageStateの読み込みに失敗した場合は、新規ログインを実行
        console.warn("Failed to load storage state, performing fresh login");
      }
    }

    // 認証が必要なページにアクセスして、認証状態を確認
    await page.goto("/profile", { waitUntil: "networkidle" });

    // ログインページにリダイレクトされた場合は、認証が必要
    if (page.url().includes("/login")) {
      await this.loginAsMockUser(page);

      // ログイン成功後、storageStateを保存
      await this.saveStorageState(context);
    }
  }

  /**
   * 認証状態をstorageStateとして保存
   * 次回のテスト実行時に再利用できるようにします
   */
  private static async saveStorageState(
    context: BrowserContext
  ): Promise<void> {
    try {
      // ディレクトリが存在しない場合は作成
      const dir = path.dirname(this.STORAGE_STATE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // storageStateを保存
      const storageState = await context.storageState();
      fs.writeFileSync(
        this.STORAGE_STATE_PATH,
        JSON.stringify(storageState, null, 2)
      );
    } catch (error) {
      console.warn("Failed to save storage state:", error);
    }
  }

  /**
   * storageStateをクリア
   * テストの初期化時に使用します
   */
  static clearStorageState(): void {
    if (fs.existsSync(this.STORAGE_STATE_PATH)) {
      fs.unlinkSync(this.STORAGE_STATE_PATH);
    }
  }
}
