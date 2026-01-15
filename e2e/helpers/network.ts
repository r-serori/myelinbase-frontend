import { Page } from "@playwright/test";

/**
 * 3Dアセットなどの重い外部リソースや、テストに不要な外部通信をブロックします。
 * これにより、ページの読み込み完了待ちでテストがタイムアウトするのを防ぎます。
 */
export const blockExternal3DResources = async (page: Page) => {
  // .hdr (High Dynamic Range) 画像のリクエストをブロック
  // これが ThreeTitleLogo での CORS エラーの原因です
  await page.route("**/*.hdr", (route) => route.abort());

  // 必要に応じて他の不要なリソースもここでブロックできます
  // await page.route("**/*.glb", (route) => route.abort());
};
