import UploadForm from "@/features/documents/components/UploadForm";
import { Modal } from "@/components/ui/Modal";
import { Text } from "@/components/ui/Text";
import type { DocumentResponse } from "@/lib/api/generated/model";

export default function FileUploadModal({
  showUploadModal,
  setShowUploadModal,
  refetch,
  showGuide,
  allTags,
  onAppendDocuments,
  existingFileNames,
}: {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  refetch: () => Promise<unknown>;
  showGuide?: boolean;
  allTags?: string[];
  onAppendDocuments?: (docs: DocumentResponse[]) => void;
  existingFileNames?: string[];
}) {
  const tooltipContent = (
    <Text variant="sm" leading="relaxed">
      1. ファイルを選択 <br />
      2. タグを入力（任意）
      <br /> &nbsp;&nbsp;・タグを付けることで、後に検索しやすくなります。
      <br />
      3. アップロード
      <br />
      4. ステータスが「完了」になったドキュメントは、chat画面で引用できます。
    </Text>
  );
  return (
    <Modal
      aria-label="ファイルアップロードモーダル"
      isOpen={showUploadModal}
      title="ファイルアップロード"
      tooltipContent={tooltipContent}
      size="2xl"
      onClose={() => setShowUploadModal(false)}
    >
      {showGuide && (
        <Text variant="sm" color="muted" className="mb-3">
          ファイルを選択してアップロードできます。タグ（任意）を付けると、後から検索しやすくなります。
        </Text>
      )}
      <UploadForm
        onUploaded={(docs) => {
          onAppendDocuments?.(docs);
          refetch();
          setShowUploadModal(false);
        }}
        allTags={allTags}
        existingFileNames={existingFileNames}
      />
    </Modal>
  );
}
