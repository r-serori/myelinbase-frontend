/**
 * チャットテスト用の定数
 *
 * テストで使用する共通の定数を定義します。
 */

// ========== URLとパス ==========
export const CHAT_PAGE_URL = "/chat";
export const LOGIN_PAGE_URL = "/login";
export const DOCUMENTS_PAGE_URL = "/documents";

// ========== タイムアウト ==========
export const TIMEOUTS = {
  /** ページ読み込みのタイムアウト（ms） */
  PAGE_LOAD: 10000,
  /** API応答のタイムアウト（ms） */
  API_RESPONSE: 15000,
  /** ストリーミング完了のタイムアウト（ms） */
  STREAMING_COMPLETE: 60000,
  /** トースト表示のタイムアウト（ms） */
  TOAST_VISIBLE: 5000,
  /** アニメーション完了のタイムアウト（ms） */
  ANIMATION: 500,
  /** サイドバートグルのタイムアウト（ms） */
  SIDEBAR_TOGGLE: 300,
  /** 入力レスポンスのタイムアウト（ms） */
  INPUT_RESPONSE: 200,
} as const;

// ========== テストデータ ==========
export const TEST_DATA = {
  /** テスト用のメッセージ */
  SAMPLE_MESSAGE: "テストメッセージ",
  /** 長いメッセージ（展開ボタンテスト用） */
  LONG_MESSAGE: "1行目\n2行目\n3行目\n4行目\n5行目\n6行目\n7行目\n8行目\n9行目",
  /** 空のメッセージ */
  EMPTY_MESSAGE: "",
  /** 特殊文字を含むメッセージ */
  SPECIAL_CHARS_MESSAGE: "<script>alert('test')</script>",
  /** 日本語メッセージ */
  JAPANESE_MESSAGE: "これは日本語のテストメッセージです。",
  /** 英語メッセージ */
  ENGLISH_MESSAGE: "This is a test message in English.",
  /** テスト用セッションID */
  TEST_SESSION_ID: "test-session-123",
  /** テスト用セッション名 */
  TEST_SESSION_NAME: "テストセッション",
} as const;

// ========== UI要素のテキスト ==========
export const UI_TEXT = {
  // プレースホルダー
  INPUT_PLACEHOLDER: "質問を入力してください",

  // ボタンラベル（aria-label）
  SEND_BUTTON: "送信",
  VOICE_INPUT_BUTTON: "音声入力",
  STOP_BUTTON: "生成を停止",
  RECORDING_BUTTON: "録音を停止",
  EXPAND_BUTTON: "チャット入力を最大化",
  MINIMIZE_BUTTON: "チャット入力を最小化",
  SIDEBAR_TOGGLE_BUTTON: "チャットハンバーガー",

  // セッション関連
  NEW_CHAT_BUTTON: "チャットを新規作成",
  EDIT_SESSION_TITLE: "チャット名を変更",
  DELETE_SESSION_TITLE: "チャットを削除",
  DELETE_SESSION_CONFIRM: "このチャット履歴を削除しますか？",

  // モーダルボタン
  SAVE_BUTTON: "保存",
  CANCEL_BUTTON: "キャンセル",
  DELETE_BUTTON: "削除",
  RENAME_BUTTON: "名前を変更",

  // ローディング状態
  SAVING: "保存中...",
  DELETING: "削除中...",

  // ドキュメントプレビュー
  OPEN_ORIGINAL_FILE: "元のファイルを開く",

  // エラーメッセージ
  CHAT_SEND_ERROR: "チャットの送信に失敗しました。再度お試しください。",
  GENERIC_ERROR: "エラーが発生しました。",
} as const;

// ========== セレクター ==========
export const SELECTORS = {
  // チャット入力関連
  CHAT_INPUT: '[placeholder="質問を入力してください"]',
  SEND_BUTTON: "#chat-send-button",

  // セッション関連
  SESSION_LINK: 'a[href*="/chat?sessionId="]',
  SESSION_SIDEBAR: "aside",
  SESSION_LIST: 'ul:has(a[href*="/chat?sessionId="])',

  // メッセージ関連
  MESSAGES_CONTAINER: 'div[class*="max-w-3xl"]',
  USER_MESSAGE: '[class*="user-message"]',
  AI_MESSAGE: '[class*="ai-message"]',

  // モーダル関連
  DIALOG: '[role="dialog"]',
  MODAL_INPUT: '[role="dialog"] input',

  // 通知関連
  TOAST: '[role="alert"]',
  ALERT_DIALOG: '[role="alertdialog"]',

  // ドキュメントプレビュー
  DOCUMENT_PREVIEW_SIDEBAR: 'aside:has-text("元のファイルを開く")',
} as const;

// ========== ビューポートサイズ ==========
export const VIEWPORTS = {
  MOBILE: { width: 375, height: 667 },
  MOBILE_LANDSCAPE: { width: 667, height: 375 },
  TABLET: { width: 768, height: 1024 },
  TABLET_LANDSCAPE: { width: 1024, height: 768 },
  DESKTOP: { width: 1280, height: 720 },
  DESKTOP_LARGE: { width: 1920, height: 1080 },
} as const;

// ========== キーボードショートカット ==========
export const KEYBOARD = {
  SEND: "Enter",
  NEW_LINE: "Shift+Enter",
  TAB: "Tab",
  ESCAPE: "Escape",
} as const;

// ========== フィードバックタイプ ==========
export const FEEDBACK_TYPES = {
  NONE: "NONE",
  GOOD: "GOOD",
  BAD: "BAD",
} as const;

// ========== メッセージステータス ==========
export const MESSAGE_STATUS = {
  PENDING: "pending",
  STREAMING: "streaming",
  COMPLETE: "complete",
  ERROR: "error",
} as const;

// ========== サイドバー状態 ==========
export const SIDEBAR_STATE = {
  EXPANDED_WIDTH: "md:w-56",
  COLLAPSED_WIDTH: "w-16",
} as const;

// ========== APIエンドポイント ==========
export const API_ENDPOINTS = {
  CHAT_STREAM: "/chat/stream",
  SESSIONS: "/api/sessions",
  SESSION_MESSAGES: (sessionId: string) =>
    `/api/sessions/${sessionId}/messages`,
  UPDATE_SESSION: (sessionId: string) => `/api/sessions/${sessionId}`,
  DELETE_SESSION: (sessionId: string) => `/api/sessions/${sessionId}`,
} as const;

// ========== エラーコード ==========
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ========== ストリーミングイベントタイプ ==========
export const STREAMING_EVENT_TYPES = {
  TEXT: "text",
  SESSION_INFO: "session_info",
  CITATIONS: "citations",
  DONE: "[DONE]",
} as const;
