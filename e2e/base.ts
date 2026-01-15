import { test as base } from "@playwright/test";

import { blockExternal3DResources } from "./helpers/network";

/**
 * 全テスト共通のカスタムtest関数
 * * ページが開かれるたびに自動的に blockExternal3DResources を実行し、
 * 重い3DアセットやCORSエラーの原因となるリソースをブロックします。
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // テスト開始前に3Dリソースのブロックを適用
    await blockExternal3DResources(page);

    // テスト本体を実行
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

// expect はそのまま再エクスポート
export { expect } from "@playwright/test";
