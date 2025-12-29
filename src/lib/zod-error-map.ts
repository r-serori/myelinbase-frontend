import { z } from "zod";

import { ErrorCode } from "@/lib/api/generated/model";

const customErrorMap: z.core.$ZodErrorMap = (issue) => {
  const pathKey = issue.path?.join(".") ?? "";

  // =================================================================
  // 文字数・個数制限 (too_big)
  // =================================================================
  if (issue.code === "too_big") {
    if (issue.origin === "string") {
      // tags.0, tags.1 など（配列内の文字列要素）→ 文字数制限
      if (/^tags\.\d+$/.test(pathKey)) {
        return ErrorCode.DOCUMENTS_TAG_LENGTH_LIMIT;
      }
      // ファイル名の文字数制限 (255文字)
      if (pathKey.includes("fileName")) {
        return ErrorCode.DOCUMENTS_INVALID_FILENAME_LENGTH_LIMIT;
      }
      // チャットクエリ (20000文字)
      if (pathKey === "query") {
        return ErrorCode.CHAT_QUERY_TOO_LONG;
      }
      // フィードバックコメント (1000文字)
      if (pathKey === "comment") {
        return ErrorCode.CHAT_COMMENT_TOO_LONG;
      }
      // セッション名 (100文字)
      if (pathKey === "sessionName") {
        return ErrorCode.CHAT_SESSION_NAME_TOO_LONG;
      }
    }

    if (issue.origin === "array") {
      // ファイルの選択上限数制限 (20個)
      if (pathKey === "files") {
        return ErrorCode.DOCUMENTS_SELECTION_TOO_MANY;
      }
      // tags（配列自体）→ 個数制限
      if (pathKey === "tags") {
        return ErrorCode.DOCUMENTS_TAGS_TOO_MANY;
      }
      // フィードバック理由 (10個)
      if (pathKey === "reasons") {
        return ErrorCode.CHAT_FEEDBACK_REASONS_INVALID;
      }
    }

    if (issue.origin === "number") {
      // ファイルサイズ制限
      if (pathKey.includes("fileSize")) {
        return ErrorCode.DOCUMENTS_FILE_TOO_LARGE;
      }
    }

    return ErrorCode.VALIDATION_FAILED;
  }

  // =================================================================
  // 最小数制限 (too_small)
  // =================================================================
  if (issue.code === "too_small") {
    if (issue.origin === "array") {
      if (pathKey === "files") {
        return ErrorCode.DOCUMENTS_SELECTION_EMPTY;
      }
      if (pathKey === "reasons") {
        return ErrorCode.CHAT_FEEDBACK_REASONS_EMPTY;
      }
      if (pathKey === "documentIds") {
        return ErrorCode.DOCUMENTS_SELECTION_EMPTY;
      }
    }

    if (issue.origin === "string") {
      if (pathKey.includes("fileName")) {
        return ErrorCode.DOCUMENTS_FILENAME_EMPTY;
      }
      if (pathKey === "query") {
        return ErrorCode.CHAT_QUERY_EMPTY;
      }
      if (pathKey === "sessionName") {
        return ErrorCode.CHAT_SESSION_NAME_EMPTY;
      }
      return ErrorCode.MISSING_PARAMETER;
    }

    return ErrorCode.MISSING_PARAMETER;
  }

  // =================================================================
  // 型・値の不正
  // =================================================================
  if (issue.code === "invalid_type") {
    if (issue.received === "undefined" || issue.received === "null") {
      return ErrorCode.MISSING_PARAMETER;
    }
    return ErrorCode.INVALID_PARAMETER;
  }

  if (issue.code === "invalid_format") {
    return ErrorCode.INVALID_PARAMETER;
  }

  if (issue.code === "invalid_value") {
    return ErrorCode.INVALID_PARAMETER;
  }

  // カスタムバリデーション (.refineなど)
  if (issue.code === "custom") {
    // refineでErrorCodeを直接渡している場合はそのまま使用
    if (
      issue.message &&
      Object.values(ErrorCode).includes(issue.message as ErrorCode)
    ) {
      return issue.message;
    }
  }

  if (issue.code === "unrecognized_keys") {
    return ErrorCode.INVALID_PARAMETER;
  }

  if (issue.code === "invalid_union") {
    return ErrorCode.INVALID_PARAMETER;
  }

  return undefined;
};

export function registerZodErrorMap() {
  z.setErrorMap(customErrorMap);
}
