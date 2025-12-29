import { ErrorCode } from "@/lib/api/generated/model";

/**
 * エラーオブジェクトからユーザー向けのエラーメッセージを取得する
 */
export function getErrorMessage(code: ErrorCode): string {
  if (!code) {
    return "予期せぬエラーが発生しました。";
  }
  switch (code) {
    // --- 汎用 ---
    case ErrorCode.VALIDATION_FAILED:
      return "入力内容に不備があります。確認してください。";
    case ErrorCode.INVALID_PARAMETER:
      return "不正なリクエストです。";
    case ErrorCode.MISSING_PARAMETER:
      return "必要な情報が不足しています。";
    case ErrorCode.PERMISSION_DENIED:
      return "権限がありません。ログインし直してください。";
    case ErrorCode.RESOURCE_NOT_FOUND:
      return "対象のデータが見つかりませんでした。";
    case ErrorCode.INTERNAL_SERVER_ERROR:
      return "サーバーエラーが発生しました。しばらくしてから再度お試しください。";

    // --- ドキュメント関連 ---
    case ErrorCode.DOCUMENTS_FILE_TOO_LARGE:
      return "ファイルサイズが大きすぎます (上限50MB)。";
    case ErrorCode.DOCUMENTS_UNSUPPORTED_FILE_TYPE:
      return "サポートされていないファイル形式です (PDF, Text, Markdown, CSVのみ)。";
    case ErrorCode.DOCUMENTS_SELECTION_TOO_MANY:
      return "ファイルが多すぎます (上限20個)。";
    case ErrorCode.DOCUMENTS_INVALID_FILENAME_LENGTH_LIMIT:
      return "ファイル名が長すぎます。";
    case ErrorCode.DOCUMENTS_TAGS_TOO_MANY:
      return "タグの数が多すぎます (上限20個)。";
    case ErrorCode.DOCUMENTS_TAG_LENGTH_LIMIT:
      return "タグの文字数が長すぎます (上限50文字)。";
    case ErrorCode.DOCUMENTS_UPLOAD_FAILED:
      return "ファイルのアップロード処理に失敗しました。";
    case ErrorCode.DOCUMENTS_NOT_READY_FOR_DOWNLOAD:
      return "ファイルの準備ができていません。処理完了までお待ちください。";
    case ErrorCode.DOCUMENTS_FILENAME_EMPTY:
      return "ファイル名が入力されていません。";
    case ErrorCode.DOCUMENTS_SELECTION_EMPTY:
      return "ファイルが選択されていません。";

    // --- チャット関連 ---
    case ErrorCode.CHAT_QUERY_EMPTY:
      return "質問内容を入力してください。";
    case ErrorCode.CHAT_QUERY_TOO_LONG:
      return "質問が長すぎます。短くまとめてください。";
    case ErrorCode.CHAT_SESSION_NAME_EMPTY:
      return "セッション名を入力してください。";

    default:
      return "予期せぬエラーが発生しました。";
  }
}
