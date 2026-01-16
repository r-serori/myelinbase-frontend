import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseTags(value: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of value.split(",")) {
    const v = part.trim();
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/**
 * ファイルのSHA-256ハッシュを計算する
 * Web Crypto API を使用してブラウザ上で高速にハッシュ計算を行う
 */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

/**
 * 複数ファイルのハッシュを並列計算する
 */
export async function computeFileHashes(
  files: File[]
): Promise<Map<string, string>> {
  const results = await Promise.all(
    files.map(async (file) => {
      const hash = await computeFileHash(file);
      return { name: file.name, hash };
    })
  );

  const hashMap = new Map<string, string>();
  results.forEach(({ name, hash }) => {
    hashMap.set(name, hash);
  });

  return hashMap;
}
