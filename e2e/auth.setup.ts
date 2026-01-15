// ./base から test (setup) をインポート
import fs from "fs";
import path from "path";

import { LoginPage } from "./pom/LoginPage";
import { test as setup } from "./base";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  // 環境変数のチェック
  if (!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD) {
    throw new Error(
      "E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set in .env.local"
    );
  }

  // ディレクトリが存在することを確認
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // ログイン操作
  await page.waitForLoadState("networkidle");
  await loginPage.login(
    process.env.E2E_TEST_EMAIL,
    process.env.E2E_TEST_PASSWORD
  );

  // ログイン成功（/documentsへの遷移）を待つ
  await page.waitForURL(/\/documents/);

  await page.waitForTimeout(1000);

  // 認証状態（Cookie, LocalStorage）をファイルに保存
  await page.context().storageState({ path: authFile });
});
