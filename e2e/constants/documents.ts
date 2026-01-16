/**
 * ドキュメントテスト用の定数
 *
 * テストで使用する共通の定数を定義します。
 */

// ========== URLとパス ==========
export const DOCUMENTS_PAGE_URL = "/documents";
export const LOGIN_PAGE_URL = "/login";
export const CHAT_PAGE_URL = "/chat";

// ========== タイムアウト ==========
export const TIMEOUTS = {
  /** ページ読み込みのタイムアウト（ms） */
  PAGE_LOAD: 10000,
  /** API応答のタイムアウト（ms） */
  API_RESPONSE: 15000,
  /** モーダル表示のタイムアウト（ms） */
  MODAL_OPEN: 5000,
  /** トースト表示のタイムアウト（ms） */
  TOAST_VISIBLE: 5000,
  /** アニメーション完了のタイムアウト（ms） */
  ANIMATION: 1000,
  /** ファイルアップロードのタイムアウト（ms） */
  FILE_UPLOAD: 30000,
  /** ドキュメント処理のタイムアウト（ms） */
  DOCUMENT_PROCESSING: 60000,
} as const;

// ========== テストデータ ==========
export const TEST_DATA = {
  /** 有効なファイル名 */
  VALID_FILENAME: "test-document.pdf",
  /** 無効なファイル名（長すぎる） */
  INVALID_FILENAME_TOO_LONG: "a".repeat(300) + ".pdf",
  /** 検索用のサンプルファイル名 */
  SEARCH_FILENAME: "検索テスト用ドキュメント",
  /** 存在しないファイル名 */
  NONEXISTENT_FILENAME: "nonexistent-file-12345.pdf",
  /** サンプルタグ */
  SAMPLE_TAGS: ["会社規定", "人事", "総務", "経理"],
  /** 検索用タグ */
  SEARCH_TAG: "テスト用タグ",
} as const;

// ========== ファイル形式 ==========
export const ALLOWED_FILE_TYPES = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
] as const;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
] as const;

// ========== ステータス ==========
export const DOCUMENT_STATUSES = {
  COMPLETED: "完了",
  PROCESSING: "処理中",
  ERROR: "エラー",
  PENDING_UPLOAD: "保留中",
} as const;

export const STATUS_FILTER_OPTIONS = {
  ALL: "すべて",
  COMPLETED: "完了",
  PROCESSING: "処理中",
  ERROR: "エラー",
  UNTAGGED: "タグ未設定",
} as const;

// ========== ページネーション ==========
export const PAGINATION = {
  /** 1ページあたりの表示件数 */
  PAGE_SIZE: 20,
  /** テスト用の大量ドキュメント数 */
  LARGE_DOCUMENT_COUNT: 50,
} as const;

// ========== UI要素のテキスト ==========
export const UI_TEXT = {
  // ボタン
  UPLOAD_BUTTON: "ファイルをアップロード",
  GUIDE_BUTTON_SHOW: "説明書",
  GUIDE_BUTTON_HIDE: "説明を隠す",
  SEARCH_BUTTON_TITLE: "検索を実行",
  CLEAR_ALL_BUTTON: "すべてクリア",
  DELETE_BUTTON: "削除",
  DETAILS_BUTTON: "詳細",
  BATCH_DELETE_BUTTON: "まとめて削除",
  CANCEL_BUTTON: "キャンセル",
  CONFIRM_DELETE_BUTTON: "削除する",

  // タイトル・ラベル
  UPLOAD_MODAL_TITLE: "ファイルアップロード",
  DELETE_CONFIRM_TITLE: "削除の確認",
  FILE_LIST_TITLE: "アップロード済みファイル一覧",

  // 説明書テキスト
  GUIDE_TEXT:
    "この画面では、社内ドキュメントのアップロード・タグ付け・検索ができます",

  // テーブルヘッダー
  TABLE_HEADER_FILENAME: "ファイル名",
  TABLE_HEADER_STATUS: "ステータス",
  TABLE_HEADER_TAGS: "タグ",
  TABLE_HEADER_CREATED_AT: "作成日時",
  TABLE_HEADER_ACTIONS: "操作",

  // 空状態・エラー
  EMPTY_STATE_TEXT: "ドキュメントが見つかりませんでした。",
  LOADING_TEXT: "読み込み中",
  PENDING_DOCS_TEXT: "件のファイルを処理中",

  // プレースホルダー
  FILENAME_SEARCH_PLACEHOLDER: "ファイル名で検索",
  TAG_SEARCH_PLACEHOLDER: "例: 会社規定, 労働基準",

  // トースト
  DELETE_SUCCESS_MESSAGE: "削除しました",
  DELETE_ERROR_MESSAGE: "削除に失敗しました",
  UPLOAD_SUCCESS_MESSAGE: "アップロードしました",
  UPLOAD_ERROR_MESSAGE: "アップロードに失敗しました",
  TAG_UPDATE_SUCCESS_MESSAGE: "タグを更新しました",
} as const;

// ========== エラーメッセージ ==========
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "ネットワークエラーが発生しました",
  SERVER_ERROR: "サーバーエラーが発生しました",
  UNAUTHORIZED: "認証が必要です",
  FORBIDDEN: "アクセス権限がありません",
  NOT_FOUND: "ドキュメントが見つかりません",
  FILE_TOO_LARGE: "ファイルサイズが上限を超えています",
  INVALID_FILE_TYPE: "サポートされていないファイル形式です",
} as const;

// ========== ビューポートサイズ ==========
export const VIEWPORTS = {
  MOBILE: { width: 375, height: 667 },
  TABLET: { width: 768, height: 1024 },
  DESKTOP: { width: 1280, height: 720 },
  DESKTOP_LARGE: { width: 1920, height: 1080 },
} as const;

// ========== セレクター ==========
export const SELECTORS = {
  // テーブル関連
  TABLE_BODY: "tbody",
  TABLE_ROW: "tbody tr",
  TABLE_HEADER: "thead",
  CHECKBOX: 'input[type="checkbox"]',

  // モーダル関連
  DIALOG: '[role="dialog"]',
  MODAL_CLOSE_BUTTON: '[aria-label="Close"]',

  // フォーム関連
  FILE_INPUT: 'input[type="file"]',

  // 通知関連
  TOAST: '[role="alert"]',
  ALERT_DIALOG: '[role="alertdialog"]',
} as const;
