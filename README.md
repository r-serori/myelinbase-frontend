# Frontend - Myelin Base

Next.jsベースのフロントエンドアプリケーションです。認証、チャット、ドキュメント管理機能を提供します。

## 📋 目次

- [技術スタック](#-技術スタック)
- [前提条件](#-前提条件)
- [セットアップ](#-セットアップ)
- [開発](#-開発)
- [ビルド・デプロイ](#-ビルドデプロイ)
- [プロジェクト構造](#-プロジェクト構造)
- [テスト](#-テスト)
- [APIコード生成](#-apiコード生成)
- [コントリビューション](#-コントリビューション)

## 🛠 技術スタック

- **フレームワーク**: [Next.js](https://nextjs.org/) 16 (App Router)
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **UIライブラリ**: [React](https://react.dev/) 19
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com/) 4
- **状態管理**: [TanStack Query](https://tanstack.com/query) (React Query)
- **認証**: [AWS Amplify](https://aws.amazon.com/amplify/)
- **APIコード生成**: [Orval](https://orval.dev/)
- **テスト**: [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/)
- **モック**: [MSW](https://mswjs.io/) (Mock Service Worker)

## 📦 前提条件

- Node.js 20以上
- npm または yarn
- AWS Amplifyの設定（認証機能を使用する場合）

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、必要な環境変数を設定してください。

`.env.local.example` ファイルを参考にしてください。

```bash
# .env.local の例
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
# AWS Amplify設定
NEXT_PUBLIC_AWS_REGION=ap-northeast-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-pool-id
NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=your-client-id

# E2Eテスト用の認証情報（Playwrightテストで使用）
E2E_TEST_EMAIL=test@example.com
E2E_TEST_PASSWORD=TestPassword123
```

**注意**:

- `.env.local` はGitにコミットされません（`.gitignore`に含まれています）
- E2Eテストを実行する場合は、`E2E_TEST_EMAIL`と`E2E_TEST_PASSWORD`を設定してください
- CI/CD環境では、環境変数をCI/CDプラットフォームの設定で指定してください（Vercelの環境変数とは別です）

### 3. APIコードの生成（初回のみ、またはAPI仕様変更時）

バックエンドのOpenAPI仕様からフロントエンド用のAPIクライアントコードを生成します。

```bash
npm run orval
```

## 💻 開発

### 開発サーバーの起動

```bash
npm run dev
```

開発サーバーは `http://localhost:3001` で起動します。

ブラウザで [http://localhost:3001](http://localhost:3001) を開いてアプリケーションを確認できます。

### 利用可能なスクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# リント
npm run lint

# ユニットテスト実行
npm test

# APIコード生成
npm run orval
```

## 🚢 ビルド・デプロイ

### ビルド

```bash
npm run build
```

### デプロイ

このプロジェクトは [Vercel](https://vercel.com/) にデプロイされています。

#### デプロイ環境

- **本番環境**: `main` ブランチへのマージ時に自動デプロイ
- **プレビュー環境**: `main` 以外のブランチへのプッシュ時に自動デプロイ

#### デプロイフロー

1. `main` ブランチへのマージ → 本番環境にデプロイ
2. その他のブランチへのプッシュ → プレビュー環境にデプロイ

Vercelの設定により、GitHubリポジトリと連携して自動的にデプロイが実行されます。

## 📁 プロジェクト構造

```text
frontend/
├── src/
│   ├── app/                    # Next.js App Router (ページルーティング)
│   │   ├── chat/               # チャットページ
│   │   ├── documents/          # ドキュメント管理ページ
│   │   ├── login/              # ログインページ
│   │   ├── register/           # 登録ページ
│   │   └── ...
│   ├── components/
│   │   └── ui/                 # 汎用UIコンポーネント
│   ├── features/               # 機能ごとのドメインロジック
│   │   ├── auth/               # 認証機能
│   │   ├── chat/               # チャット機能
│   │   └── documents/          # ドキュメント管理機能
│   ├── hooks/                  # 汎用カスタムフック
│   ├── lib/                    # 汎用ユーティリティ・APIクライアント
│   │   └── api/
│   │       └── generated/      # Orvalで生成されたAPIコード
│   ├── providers/              # React Context プロバイダー
│   └── mocks/                  # MSWモックハンドラー
├── e2e/                        # E2Eテスト (Playwright)
├── public/                     # 静的ファイル
└── ...
```

詳細なディレクトリ構成とアーキテクチャの指針については、[CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## 🧪 テスト

### ユニットテスト

[Vitest](https://vitest.dev/) を使用してユニットテストを実行します。

```bash
npm test
```

### E2Eテスト

[Playwright](https://playwright.dev/) を使用してE2Eテストを実行します。

```bash
# テスト実行
npx playwright test

# UIモードでテスト実行
npx playwright test --ui

# 特定のテストファイルを実行
npx playwright test e2e/specs/landing.spec.ts

# レポート表示
npx playwright show-report
```

**E2Eテスト用の環境変数**:

- E2Eテストを実行する場合は、`.env.local`に以下の環境変数を設定してください：
  - `E2E_TEST_EMAIL`: テストで使用する既存ユーザーのメールアドレス
  - `E2E_TEST_PASSWORD`: テストで使用する既存ユーザーのパスワード
- これらの環境変数が設定されていない場合、デフォルト値（`test@example.com` / `TestPassword123`）が使用されます
- **重要**: Vercelの環境変数は、Vercelにデプロイされたアプリケーションでのみ使用可能です。Playwrightテストは別の環境で実行されるため、ローカルでは`.env.local`、CI/CDではCI/CDプラットフォームの環境変数設定を使用してください

E2Eテストの詳細は `e2e/` ディレクトリを参照してください。

## 🔧 APIコード生成

バックエンドのOpenAPI仕様 (`../myelinbase-backend/doc/openapi.yaml`) から、以下のコードを自動生成します：

- **React Query フック**: API呼び出し用のカスタムフック
- **Zodスキーマ**: フロントエンドでのバリデーション用

### 生成コマンド

```bash
npm run orval
```

生成されたコードは `src/lib/api/generated/` に配置されます。

### 設定

生成設定は `orval.config.ts` で管理されています。

## 🤝 コントリビューション

コントリビューションを歓迎します！詳細な開発ガイドラインについては、[CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

主なガイドライン：

- Feature-based ディレクトリ構成を採用
- Server Components を優先的に使用
- ESLint と Prettier による自動フォーマット
- 命名規則の遵守

## 📚 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Orval Documentation](https://orval.dev/)
- [Playwright Documentation](https://playwright.dev/)

## 📄 ライセンス

このプロジェクトはプライベートプロジェクトです。
