import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

/**
 * 環境変数の読み込み
 * .env.local があれば読み込みますが、CI環境などではシステムの環境変数が優先されます。
 */
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

/**
 * 認証状態を保存するファイルのパス
 * setupプロジェクトで生成された認証情報(Cookieなど)をここに保存し、
 * 他のプロジェクトで再利用します。
 */
const authFile = path.join(__dirname, "playwright/.auth/user.json");

/**
 * テスト対象のURL
 * コマンドラインで `BASE_URL=https://...` のように指定された場合はそれを優先し、
 * なければローカル開発環境のURLを使用します。
 */
const baseURL = process.env.BASE_URL || "http://localhost:3001";

/**
 * Playwrightの設定ファイル
 * Vercel Preview環境やAWS Dev環境に対する実行を想定して調整しています。
 */
export default defineConfig({
  testDir: "./e2e",

  // テスト全体のタイムアウト（ミリ秒）。リモート環境はネットワーク遅延があるため少し長めに設定。
  timeout: 60 * 1000,

  expect: {
    // アサーションのタイムアウト（例: expect(locator).toBeVisible()）
    timeout: 10 * 1000,
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // レポーター設定:
  // 'list': ターミナルに進行状況とエラー詳細を表示
  // 'html': ブラウザで閲覧できる詳細レポートを生成
  reporter: [["list"], ["html"]],

  use: {
    extraHTTPHeaders: {
      "x-vercel-protection-bypass":
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "",
    },

    // 設定したBase URLを使用
    baseURL: baseURL,

    // トレース: 失敗した場合は必ず保存（DOMスナップショット、コンソールログ、ネットワーク通信を含む）
    // デバッグ時に最も役立つ情報です。
    trace: "retain-on-failure",

    // スクリーンショット: 失敗時のみ保存
    screenshot: "only-on-failure",

    // ビデオ: 失敗時のみ録画を保存（どのような挙動で失敗したか動画で確認可能）
    // video: "retain-on-failure",
  },

  projects: [
    // Setup project: 認証を行い、stateを保存する
    // auth.setup.tsを実行してログイン処理を行います
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // Main projects
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 保存された認証情報（storageState）を使用する
        // これにより、各テストはログイン済みの状態で開始されます
        storageState: authFile,
      },
      // setupプロジェクトが成功してから実行する依存関係を設定
      dependencies: ["setup"],
    },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* * ローカルサーバーの自動起動設定 */
  // webServer: baseURL.includes('localhost') ? {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // } : undefined,
});
