# **開発ガイドライン**

このプロジェクトにおけるコード規約とアーキテクチャの指針です。  
開発を始める前に一読してください。

## **1\. ディレクトリ構成 (Feature-based)**

機能単位でコードを管理する「Colocation（コロケーション）」を採用しています。

src/  
├── app/                  \# Next.js App Router (ページルーティング定義のみ)  
├── features/             \# ★ 機能ごとのドメインロジック  
│   ├── auth/             \# 認証機能  
│   ├── chat/             \# チャット機能  
│   └── documents/        \# ドキュメント管理機能  
├── components/ui/        \# アプリ全体で使う汎用UIパーツ (Button, Modal等)  
├── hooks/                \# 汎用Hooks  
└── lib/                  \# 汎用ユーティリティ

### **原則**

* **ページ固有のコンポーネント:** src/features/{featureName}/components に配置する。  
* **汎用コンポーネント:** 複数の機能で使われるボタンや入力フォームのみ src/components/ui に配置する。

## **2\. Server Components vs Client Components**

Next.js App Routerのパフォーマンスを最大化するため、以下の基準で使い分けます。

| 種類 | デフォルト | 'use client' を付ける場合 |
| :---- | :---- | :---- |
| **Server Components** | **基本はこちら** | \- |
| **Client Components** | \- | useState, useEffect を使う場合 イベントハンドラ (onClick 等) を使う場合 ブラウザ専用API (window, localStorage) を使う場合 |

### **推奨パターン**

* データを取得する処理は、可能な限り Server Component (page.tsx や layout.tsx) で行い、Propsとして Client Component に渡す。  
* Client Component は、インタラクションが必要な「末端のUI部品」にするよう心がける（Leaf Component Pattern）。

## **3\. コード規約**

ESLintとPrettierによって自動的にチェック・整形されます。

### **自動整形 (Auto Fix)**

VSCodeの設定で editor.formatOnSave と editor.codeActionsOnSave を有効にすることを推奨します。保存時に以下が自動実行されます。

1. **Import順序の整理**: 自動的にグループ化・アルファベット順に並び替えられます。  
2. **未使用Importの削除**: 使われていないImport文は削除されます。  
3. **フォーマット**: Prettierの設定に従いインデントやクォートが統一されます。

### **命名規則**

| 対象 | 規則 | 例 |
| :---- | :---- | :---- |
| **コンポーネント** | PascalCase | UserProfile.tsx |
| **Hooks** | camelCase (use...) | useAuth.ts |
| **関数・変数** | camelCase | fetchUserData, isLoading |
| **型・インターフェース** | PascalCase | User, AuthResponse |
| **定数** | UPPER\_SNAKE\_CASE | MAX\_UPLOAD\_SIZE |

### **イベントハンドラの命名**

* **Propsとして受け取る場合**: on 接頭辞 (例: onClick, onSubmit)  
* **関数定義**: handle 接頭辞 (例: handleClick, handleSubmit)

// 良い例  
const handleSubmit \= () \=\> { ... };  
return \<Button onClick={handleSubmit} /\>;

## **4\. データフェッチ**

* **Server Side:** fetch または DBクライアントを直接使用する。  
* **Client Side:** React Query (TanStack Query) または SWR を使用する。useEffect での生fetchは避ける。