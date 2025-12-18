import { ApiError } from "@/lib/apiClient";
import { ErrorCode } from "@/lib/types/error-code";

/**
 * エラーオブジェクトからユーザー向けのエラーメッセージを取得する
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.errorCode) {
    const code = error.errorCode as ErrorCode;

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
      case ErrorCode.STATE_CONFLICT:
        return "現在の状態では操作できません（処理中など）。";
      case ErrorCode.INTERNAL_SERVER_ERROR:
        return "サーバーエラーが発生しました。しばらくしてから再度お試しください。";

      // --- ドキュメント関連 ---
      case ErrorCode.DOCUMENTS_FILE_TOO_LARGE:
        return "ファイルサイズが大きすぎます (上限50MB)。";
      case ErrorCode.DOCUMENTS_UNSUPPORTED_FILE_TYPE:
        return "サポートされていないファイル形式です (PDF, Text, Markdown, CSVのみ)。";
      case ErrorCode.DOCUMENTS_INVALID_FILENAME:
        return "ファイル名に使用できない文字が含まれています。";
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

      // --- チャット関連 ---
      case ErrorCode.CHAT_QUERY_EMPTY:
        return "質問内容を入力してください。";
      case ErrorCode.CHAT_QUERY_TOO_LONG:
        return "質問が長すぎます。短くまとめてください。";
      case ErrorCode.CHAT_SESSION_NAME_EMPTY:
        return "セッション名を入力してください。";
      case ErrorCode.CHAT_BEDROCK_ERROR:
        return "AIサービスの呼び出しに失敗しました。時間をおいて再試行してください。";
      case ErrorCode.CHAT_TOO_MANY_MESSAGES:
        return "メッセージ数が上限に達しました。新しいチャットを作成してください。";

      default:
        // エラーコードはあるがマッピングにない場合、またはメッセージが直接返ってきている場合
        return error.message || "予期せぬエラーが発生しました。";
    }
  }

  // ApiError以外 (ネットワークエラーなど)
  if (error instanceof Error) {
    return error.message;
  }

  return "予期せぬエラーが発生しました。";
}
