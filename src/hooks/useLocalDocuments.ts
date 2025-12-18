import { useState } from "react";
import { DocumentResponse } from "@/lib/schemas/document";

export function useLocalDocuments(apiDocs: DocumentResponse[] = []) {
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
  const [localDocuments, setLocalDocuments] = useState<DocumentResponse[]>([]);

  const mergedDocuments = useLocalDocumentsMemo(apiDocs, localDocuments, useMocks);

  return {
    mergedDocuments,
    setLocalDocuments,
    useMocks
  };
}

import { useMemo } from "react";

function useLocalDocumentsMemo(
  apiDocs: DocumentResponse[], 
  localDocs: DocumentResponse[], 
  useMocks: boolean
) {
  return useMemo(() => {
    const base = apiDocs ?? [];
    if (!useMocks) return base;
    if (localDocs.length === 0) return base;
    
    const byId = new Map<string, DocumentResponse>();
    for (const d of base) byId.set(d.documentId, d);
    for (const d of localDocs) {
      if (!byId.has(d.documentId)) {
        byId.set(d.documentId, d);
      }
    }
    return Array.from(byId.values());
  }, [apiDocs, localDocs, useMocks]);
}

