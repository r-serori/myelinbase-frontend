import { useEffect } from "react";

import { ErrorResponse } from "@/lib/api/generated/model";
import { getErrorMessage } from "@/lib/error-mapping";

import { useToast } from "../providers/ToastProvider";

export function useQueryErrorToast(isError: boolean, error: unknown) {
  const { showToast } = useToast();

  useEffect(() => {
    if (isError && error) {
      const code = (error as ErrorResponse).errorCode;
      showToast({ type: "error", message: getErrorMessage(code) });
    }
  }, [isError, error, showToast]);
}
