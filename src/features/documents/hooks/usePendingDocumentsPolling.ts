// hooks/usePendingDocumentsPolling.ts
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  DocumentStatus,
  GetDocumentsResponse,
} from "@/lib/api/generated/model";
import { queryKeys } from "@/lib/queryKeys";

const POLLING_INTERVAL = 5000; // 3秒
const MAX_POLLING_DURATION = 5 * 60 * 1000; // 5分でタイムアウト

const PENDING_STATUSES = [
  DocumentStatus.PENDING_UPLOAD,
  DocumentStatus.PROCESSING,
] as const;

export function usePendingDocumentsPolling(
  documents: GetDocumentsResponse["documents"] | undefined
) {
  const queryClient = useQueryClient();
  const pollingStartTime = useRef<number | null>(null);

  const pendingDocs =
    documents?.filter((doc) =>
      PENDING_STATUSES.includes(doc.status as (typeof PENDING_STATUSES)[number])
    ) ?? [];

  const hasPendingDocs = pendingDocs.length > 0;

  useEffect(() => {
    if (!hasPendingDocs) {
      pollingStartTime.current = null;
      return;
    }

    // ポーリング開始時刻を記録
    if (pollingStartTime.current === null) {
      pollingStartTime.current = Date.now();
    }

    const interval = setInterval(() => {
      // タイムアウトチェック
      if (
        pollingStartTime.current &&
        Date.now() - pollingStartTime.current > MAX_POLLING_DURATION
      ) {
        clearInterval(interval);
        return;
      }

      // 一覧を再フェッチ
      queryClient.invalidateQueries({ queryKey: queryKeys.documents });
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [hasPendingDocs, queryClient]);

  return {
    hasPendingDocs,
    pendingCount: pendingDocs.length,
  };
}
