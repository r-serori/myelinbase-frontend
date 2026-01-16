import { Page } from "@playwright/test";

/**
 * 3Dアセットなどの重い外部リソースや、テストに不要な外部通信をブロック
 * これにより、ページの読み込み完了待ちでテストがタイムアウトするのを防ぐ
 *
 * 注意: abort() ではなく fulfill() を使用することで、
 * ブラウザ側でのネットワークエラーを防き、Three.js のエラーログを回避
 */
export const blockExternal3DResources = async (page: Page) => {
  // .hdr (High Dynamic Range) 画像のリクエストをブロック
  await page.route("**/*.hdr", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: Buffer.alloc(0), // 空のバイナリデータ
    })
  );

  // .glb (glTF Binary) ファイルのリクエストをブロック
  await page.route("**/*.glb", (route) =>
    route.fulfill({
      status: 200,
      contentType: "model/gltf-binary",
      body: Buffer.alloc(0),
    })
  );

  // .gltf ファイルのリクエストをブロック
  await page.route("**/*.gltf", (route) =>
    route.fulfill({
      status: 200,
      contentType: "model/gltf+json",
      body: JSON.stringify({}),
    })
  );

  // .exr (OpenEXR) ファイルのリクエストをブロック
  await page.route("**/*.exr", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: Buffer.alloc(0),
    })
  );

  // .ktx2 (Khronos Texture) ファイルのリクエストをブロック
  await page.route("**/*.ktx2", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/octet-stream",
      body: Buffer.alloc(0),
    })
  );
};

/**
 * Three.js関連のコンソールエラーを無視する設定
 * ページのコンソールエラーをフィルタリングして、テストの失敗を防ぎます。
 */
export const ignoreThreeJsConsoleErrors = (page: Page) => {
  // コンソールエラーをキャッチしてフィルタリング
  page.on("console", (msg) => {
    const text = msg.text();
    // Three.js関連のエラーメッセージを無視
    const ignoredPatterns = [
      "Could not load",
      "Failed to fetch",
      "THREE.WebGLRenderer",
      "Context Lost",
      ".hdr",
      ".glb",
      ".gltf",
      ".exr",
      "potsdamer_platz",
    ];

    const shouldIgnore = ignoredPatterns.some((pattern) =>
      text.includes(pattern)
    );

    if (msg.type() === "error" && shouldIgnore) {
      // 無視（何もしない）
      return;
    }

    // デバッグ用：他のエラーは出力（必要に応じてコメントアウト）
    // if (msg.type() === "error") {
    //   console.log(`Console ${msg.type()}: ${text}`);
    // }
  });

  // ページエラーイベントも無視
  page.on("pageerror", (error) => {
    const errorMessage = error.message;
    const ignoredPatterns = [
      "Could not load",
      "Failed to fetch",
      "THREE",
      ".hdr",
      "WebGL",
    ];

    const shouldIgnore = ignoredPatterns.some((pattern) =>
      errorMessage.includes(pattern)
    );

    if (!shouldIgnore) {
      console.error("Page error:", errorMessage);
    }
  });
};

/**
 * すべての3Dリソースブロックとエラー無視を適用
 * テストのセットアップで使用する統合関数
 */
export const setupTestEnvironment = async (page: Page) => {
  await blockExternal3DResources(page);
  ignoreThreeJsConsoleErrors(page);
};
