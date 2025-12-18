import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 各テスト後にクリーンアップを行う（React Testing Libraryの自動クリーンアップを補完）
afterEach(() => {
  cleanup();
});
