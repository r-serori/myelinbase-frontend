import { getJwt } from "@/lib/auth";
import { mockFetch } from "@/lib/mocks";

export async function apiFetch(path: string, init?: RequestInit) {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    return mockFetch(path, init);
  }
  const token = await getJwt();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
    },
  });
  if (!res.ok) {
    throw new Error(`API Error ${res.status}`);
  }
  const isJson = res.headers.get("content-type")?.includes("application/json");
  return isJson ? res.json() : res.text();
}
