export function encodeCursor(key: unknown): string {
  return Buffer.from(JSON.stringify(key), "utf-8").toString("base64");
}

export function decodeCursor<T = unknown>(cursor?: string): T | undefined {
  if (!cursor) return undefined;
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
  } catch {
    return undefined;
  }
}
