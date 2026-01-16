import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  // 1. Next.js Core Vitals & TypeScript Recommended
  ...nextVitals,
  ...nextTs,

  // 2. Prettier Conflict Resolver
  // ESLintの整形ルールを無効化し、Prettierに任せる設定
  prettierConfig,

  // 3. Custom Rules
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      // --- Import Sort ---
      "simple-import-sort/exports": "error",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // 1. React, Next.js, and external libraries
            ["^react", "^next", "^@?\\w"],
            // 2. Internal packages (absolute paths using @/)
            // features, components, hooks, etc.
            ["^@/features/.*", "^@/components/.*", "^@/hooks/.*", "^@/lib/.*"],
            // 3. Side effect imports
            ["^\\u0000"],
            // 4. Parent imports (../../)
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // 5. Other relative imports (./)
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // 6. Style imports
            ["^.+\\.s?css$"],
          ],
        },
      ],

      // --- Unused Imports ---
      // TSのデフォルトルールはOFFにし、unused-importsプラグインを使う（自動削除のため）
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_", // _で始まる変数は無視
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // --- Consistency & Best Practices ---
      "react/display-name": "off", // メモ化コンポーネント等でうるさいためOFFにすることが多い
      "no-console": ["warn", { allow: ["warn", "error"] }], // logは警告、warn/errorは許可
    },
  },

  // 4. Ignores
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "public/**",
      "*.config.js",
      "*.config.mjs",
    ],
  },
]);

export default eslintConfig;