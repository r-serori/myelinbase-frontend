import { getJwt } from "@/features/auth/lib/auth";
import { ErrorCode } from "@/lib/api/generated/model";
import { env } from "@/lib/env";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;

/**
 * アプリケーション独自のAPIエラークラス
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public errorCode?: ErrorCode
  ) {
    super(message);
    this.name = "ApiError";
    // TypeScriptでカスタムエラーを拡張する際の定型句（ES5ターゲットの場合に必要となることがある）
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * 型ガード関数: エラーがApiErrorかどうかを判定する
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(headers || {}),
  };

  if (!skipAuth) {
    const token = await getJwt();
    if (token) {
      (requestHeaders as Record<string, string>)["Authorization"] =
        `Bearer ${token}`;
    }
  }

  // Remove Content-Type if body is FormData
  if (rest.body instanceof FormData) {
    delete (requestHeaders as Record<string, string>)["Content-Type"];
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      headers: requestHeaders,
      ...rest,
    });

    if (!response.ok) {
      let errorMessage = `API Error ${response.status}`;
      let errorCode: ErrorCode | undefined;

      try {
        const errorJson = await response.json();
        errorCode = errorJson.errorCode;

        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {
          // Ignore
        }
      }

      throw new ApiError(errorMessage, errorCode);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    try {
      const data = await response.json();
      return data as T;
    } catch {
      const text = await response.text().catch(() => "");
      if (text) return text as unknown as T;
      return {} as T;
    }
  } catch (error: unknown) {
    // ネットワークエラーや接続エラーの場合
    // error がオブジェクトであり、かつ特定のプロパティを持つか安全にチェック
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        `ネットワークエラー: バックエンドサーバーに接続できません (${url})`,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }
    // その他のエラーはそのまま再スロー
    throw error;
  }
}
