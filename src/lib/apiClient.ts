import { getJwt } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

// デバッグ用: 環境変数の確認（開発時のみ）
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[apiClient] API_BASE_URL:", API_BASE_URL);
  console.log(
    "[apiClient] NEXT_PUBLIC_API_BASE_URL:",
    process.env.NEXT_PUBLIC_API_BASE_URL
  );
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any,
    public errorCode?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;

  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(headers || {}),
  };

  if (!skipAuth) {
    try {
      const token = await getJwt();
      if (token) {
        (requestHeaders as any)["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Failed to get JWT token", e);
    }
  }

  // Remove Content-Type if body is FormData (browser sets it automatically with boundary)
  if (rest.body instanceof FormData) {
    delete (requestHeaders as any)["Content-Type"];
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === "development") {
    console.log("[apiClient] Request:", {
      method: rest.method || "GET",
      url,
      hasAuth: !!(requestHeaders as any)["Authorization"],
    });
  }

  try {
    const response = await fetch(url, {
      headers: requestHeaders,
      ...rest,
    });

    // デバッグログ（開発環境のみ）
    if (process.env.NODE_ENV === "development") {
      console.log("[apiClient] Response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });
    }

    if (!response.ok) {
      let errorMessage = `API Error ${response.status}`;
      let errorData = null;
      let errorCode: string | undefined;

      try {
        const errorJson = await response.json();
        errorData = errorJson;
        errorCode = errorJson.errorCode;

        // バックエンドの方針に従い、messageがない場合はerrorCodeをメッセージとして扱う
        // これにより呼び出し元で翻訳キーとして使用可能にする
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

      throw new ApiError(response.status, errorMessage, errorData, errorCode);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    try {
      const data = await response.json();
      return data as T;
    } catch (e) {
      // If response is not JSON (e.g. text or empty), return it as is if possible, or empty object
      const text = await response.text().catch(() => "");
      if (text) return text as unknown as T;
      return {} as T;
    }
  } catch (error: any) {
    // ネットワークエラーや接続エラーの場合
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new ApiError(
        0,
        `ネットワークエラー: バックエンドサーバーに接続できません (${url})`,
        null,
        "NETWORK_ERROR"
      );
    }
    // その他のエラーはそのまま再スロー
    throw error;
  }
}
