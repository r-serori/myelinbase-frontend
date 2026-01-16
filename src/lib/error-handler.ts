import { ZodError } from "zod";

import { ErrorCode } from "@/lib/api/generated/model";
import { isApiError } from "@/lib/apiClient";
import { getErrorMessage } from "@/lib/error-mapping";

// Toastを表示するための関数の型定義
type ShowToastFn = (args: { type: "error"; message: string }) => void;

/**
 * 共通のエラーハンドラー
 *
 * @param error - キャッチしたエラーオブジェクト
 * @param setError - フォームのエラーメッセージを設定する関数 (optional)
 * @param showToast - トーストを表示する関数 (optional)
 * @param defaultMessage - 予期せぬエラーの場合のデフォルトメッセージ
 */
export function handleCommonError(
  error: unknown,
  setError: (message: string) => void,
  showToast: ShowToastFn,
  defaultMessage: string
) {
  let message = defaultMessage;

  if (error instanceof ZodError) {
    const code = error.issues[0]?.message as ErrorCode;
    message = getErrorMessage(code);
    setError(message);
  } else if (isApiError(error)) {
    const code = error.errorCode as ErrorCode;
    message = getErrorMessage(code);
    showToast({ type: "error", message });
  } else if (error instanceof Error) {
    message = error.message;
    showToast({ type: "error", message });
  } else {
    showToast({
      type: "error",
      message: "予期せぬエラーが発生しました",
    });
  }
}
