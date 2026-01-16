import { defineConfig } from "orval";

export default defineConfig({
  // 1. React Query (APIフック) 生成設定
  myelin: {
    input: {
      target: "../myelinbase-backend/doc/openapi.yaml",
    },
    output: {
      mode: "tags-split",
      // 修正: tags-splitモードの場合、targetはディレクトリを指定するのが標準的です。
      // ファイル名はタグ(Controller)名に基づいて自動生成されます。
      target: "src/lib/api/generated",
      schemas: "src/lib/api/generated/model",
      client: "react-query",
      mock: false,
      prettier: true,
      clean: true, // 推奨: 生成前に古いファイルを削除
      override: {
        mutator: {
          path: "src/lib/api-client-adapter.ts",
          name: "customInstance",
        },
      },
    },
  },

  // 2. 【追加】Zodスキーマ生成設定
  // フロントエンドでのバリデーション用にスキーマを生成します
  "myelin-zod": {
    input: {
      target: "../myelinbase-backend/doc/openapi.yaml",
    },
    output: {
      mode: "tags-split",
      client: "zod",
      target: "src/lib/api/generated/zod", // Zod用ディレクトリを分けると管理しやすい
      fileExtension: ".zod.ts", // 拡張子で区別
      prettier: true,
      clean: true,
    },
  },
});
