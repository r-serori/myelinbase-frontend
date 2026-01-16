// frontend/src/lib/api-client-adapter.ts
import { apiFetch } from "@/lib/apiClient";

// Orvalが生成するリクエスト設定の型（簡易版）
// 実際にはAxiosRequestConfigに近い形ですが、必要な分だけ定義します
export type RequestConfig = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

// apiFetchに渡すための型変換を行います
export const customInstance = async <T>(
  config: RequestConfig,
  options?: RequestInit
): Promise<T> => {
  const { url, method, params, data, headers, signal } = config;

  // クエリパラメータの構築
  let query = "";
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // 配列の場合はカンマ区切りにするか、複数回追加するか
          // バックエンドの仕様によりますが、ここではカンマ区切りとします
          searchParams.append(key, value.join(","));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    query = searchParams.toString();
  }

  const fullPath = query ? `${url}?${query}` : url;

  // apiFetchの呼び出し
  return apiFetch<T>(fullPath, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    signal,
    ...options, // 追加のオプション（skipAuthなど）があればマージ
  });
};

// エラー型の定義（orval生成コードで使われることがある）
export type ErrorType<Error> = Error;
