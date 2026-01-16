import { z } from "zod";

import { ErrorCode } from "@/lib/api/generated/model";

const customErrorMap: z.core.$ZodErrorMap = (issue) => {
  const pathKey = issue.path?.join(".") ?? "";

  if (issue.code === "too_big") {
    if (issue.origin === "string") {
      if (/^tags\.\d+$/.test(pathKey)) {
        return ErrorCode.DOCUMENTS_TAG_LENGTH_LIMIT;
      }
      if (pathKey.includes("fileName")) {
        return ErrorCode.DOCUMENTS_INVALID_FILENAME_LENGTH_LIMIT;
      }
      if (pathKey === "query") {
        return ErrorCode.CHAT_QUERY_TOO_LONG;
      }
      if (pathKey === "comment") {
        return ErrorCode.CHAT_COMMENT_TOO_LONG;
      }
      if (pathKey === "sessionName") {
        return ErrorCode.CHAT_SESSION_NAME_TOO_LONG;
      }
    }

    if (issue.origin === "array") {
      if (pathKey === "files") {
        return ErrorCode.DOCUMENTS_SELECTION_TOO_MANY;
      }
      if (pathKey === "tags") {
        return ErrorCode.DOCUMENTS_TAGS_TOO_MANY;
      }
      if (pathKey === "reasons") {
        return ErrorCode.CHAT_FEEDBACK_REASONS_INVALID;
      }
    }

    if (issue.origin === "number") {
      if (pathKey.includes("fileSize")) {
        return ErrorCode.DOCUMENTS_FILE_TOO_LARGE;
      }
    }

    return ErrorCode.VALIDATION_FAILED;
  }

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

  if (issue.code === "custom") {
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
