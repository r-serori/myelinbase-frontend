import { FileText, Quote } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { SourceDocument } from "@/lib/api/generated/model";

type Props = {
  documents: SourceDocument[];
  onSourceClick?: (doc: SourceDocument) => void;
};

export default function SourceDocumentList({
  documents,
  onSourceClick,
}: Props) {
  if (!documents || documents.length === 0) return null;

  return (
    <div className="w-full mt-3 ml-1">
      <div className="mb-2 flex items-center gap-1">
        <Quote className="size-3" />
        <Text variant="xs" as="span" color="muted">
          参照ソース
        </Text>
      </div>
      <div className="flex flex-wrap gap-2">
        {documents.map((doc, idx) => (
          <div key={idx} className="relative group">
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                if (onSourceClick) onSourceClick(doc);
              }}
            >
              <FileText className="size-4 flex-shrink-0" />
              <Text variant="sm" as="span" className="truncate">
                {doc.fileName}
              </Text>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
