import { useEffect } from "react";
import { useToast } from "../components/ui/ToastProvider";
import { getErrorMessage } from "@/lib/error-mapping";

export function useQueryErrorToast(isError: boolean, error: unknown) {
  const { showToast } = useToast();

  useEffect(() => {
    if (isError && error) {
      showToast({
        type: "error",
        message: getErrorMessage(error),
      });
    }
  }, [isError, error, showToast]);
}
