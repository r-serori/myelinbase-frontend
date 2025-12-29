// /**
//  * エラーコード型定義
//  * 生成された型定義を基本として使用し、フロントエンド専用のエラーコードを拡張
//  */

// import { ErrorCode as GeneratedErrorCode } from "@/lib/api/generated/model";

// /**
//  * 生成された型定義のエラーコード
//  */
// export { ErrorCode as GeneratedErrorCode } from "@/lib/api/generated/model";

// /**
//  * フロントエンド専用のエラーコード（OpenAPIに定義されていないもの）
//  */
// export const FrontendErrorCode = {
//   // --- 400 Bad Request: 入力不備系 ---
//   INVALID_FILE_TYPE: "INVALID_FILE_TYPE", // 許可されていない拡張子
//   INVALID_INPUT: "INVALID_INPUT", // その他の入力不正

//   // --- 401 Unauthorized / 403 Forbidden: 認証・権限系 ---
//   TOKEN_EXPIRED: "TOKEN_EXPIRED",

//   // --- 409 Conflict: 競合 ---
//   DOCUMENT_ALREADY_EXISTS: "DOCUMENT_ALREADY_EXISTS", // 同名の文書が存在
//   STATE_CONFLICT: "STATE_CONFLICT", // 処理中のため操作できない

//   // --- 500 Internal Server Error: サーバー内部エラー ---
//   DB_OPERATION_FAILED: "DB_OPERATION_FAILED", // DynamoDB等の操作失敗
//   BEDROCK_API_ERROR: "BEDROCK_API_ERROR", // AIサービスの呼び出し失敗
//   S3_OPERATION_FAILED: "S3_OPERATION_FAILED", // ストレージ操作失敗

//   // --- ドキュメント関連（フロントエンド専用） ---
//   DOCUMENTS_FILE_EMPTY: "DOCUMENTS_FILE_EMPTY", // ファイルが空
//   DOCUMENTS_INVALID_FILENAME: "DOCUMENTS_INVALID_FILENAME", // ファイル名が無効
//   DOCUMENTS_TAG_INVALID: "DOCUMENTS_TAG_INVALID", // タグが無効
//   DOCUMENTS_PROCESSING_FAILED: "DOCUMENTS_PROCESSING_FAILED", // 処理に失敗した
//   DOCUMENTS_DELETE_FAILED: "DOCUMENTS_DELETE_FAILED", // 削除に失敗した
//   DOCUMENTS_EXTRACTED_TEXT_EMPTY: "DOCUMENTS_EXTRACTED_TEXT_EMPTY", // 抽出されたテキストが空

//   // --- チャット関連（フロントエンド専用） ---
//   CHAT_SESSION_NOT_FOUND: "CHAT_SESSION_NOT_FOUND",
//   CHAT_HISTORY_NOT_FOUND: "CHAT_HISTORY_NOT_FOUND",
//   CHAT_BEDROCK_ERROR: "CHAT_BEDROCK_ERROR",
//   CHAT_NO_DOCUMENTS: "CHAT_NO_DOCUMENTS",
//   CHAT_TOO_MANY_MESSAGES: "CHAT_TOO_MANY_MESSAGES",
// } as const;

// /**
//  * すべてのエラーコードのUnion型
//  * 生成された型定義 + フロントエンド専用のエラーコード
//  */
// export type ErrorCode =
//   | GeneratedErrorCode
//   | (typeof FrontendErrorCode)[keyof typeof FrontendErrorCode];

// /**
//  * エラーコードの定数オブジェクト（後方互換性のため）
//  */
// export const ErrorCode = {
//   ...GeneratedErrorCode,
//   ...FrontendErrorCode,
// } as const;
