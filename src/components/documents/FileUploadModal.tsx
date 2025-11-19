import UploadForm from "./UploadForm";
import type { DocumentItem } from "@/lib/types";

export default function FileUploadModal({
  showUploadModal,
  setShowUploadModal,
  refetch,
  showGuide,
  allTags,
  onAppendDocuments,
}: {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  refetch: () => void;
  showGuide: boolean;
  allTags?: string[];
  onAppendDocuments?: (docs: DocumentItem[]) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setShowUploadModal(false)}
      />
      <div className="relative bg-white w-full max-w-xl mx-4 rounded shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">ファイルアップロード</h2>
          <button
            type="button"
            className="text-xs border rounded px-2 py-1"
            onClick={() => setShowUploadModal(false)}
          >
            閉じる
          </button>
        </div>
        <UploadForm
          onUploaded={(docs) => {
            // 一覧画面側にモックドキュメントを渡す
            // （バックエンドが未実装でもフロントで即時に一覧反映させるため）
            // onAppendDocuments は任意
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            typeof onAppendDocuments === "function" && onAppendDocuments(docs);
            refetch();
            setShowUploadModal(false);
          }}
          showGuide={showGuide}
          allTags={allTags}
        />
      </div>
    </div>
  );
}
