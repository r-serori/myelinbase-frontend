import { useState } from "react";

import type { DocumentResponse } from "@/lib/api/generated/model";

export function useLocalDocuments(apiDocs: DocumentResponse[] = []) {
  const [localDocuments, setLocalDocuments] = useState<DocumentResponse[]>([]);

  const mergedDocuments = useLocalDocumentsMemo(apiDocs, localDocuments);

  return {
    mergedDocuments,
    setLocalDocuments,
  };
}

import { useMemo } from "react";

function useLocalDocumentsMemo(
  apiDocs: DocumentResponse[],
  localDocs: DocumentResponse[]
) {
  return useMemo(() => {
    const base = apiDocs ?? [];
    if (localDocs.length === 0) return base;

    const byId = new Map<string, DocumentResponse>();
    for (const d of base) byId.set(d.documentId, d);
    for (const d of localDocs) {
      if (!byId.has(d.documentId)) {
        byId.set(d.documentId, d);
      }
    }
    return Array.from(byId.values());
  }, [apiDocs, localDocs]);
}
