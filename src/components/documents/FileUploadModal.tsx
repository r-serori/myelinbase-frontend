import UploadForm from "./UploadForm";
import type { DocumentResponse } from "@/lib/schemas/document";
import { Text } from "../ui/Text";
import { Modal } from "../ui/Modal";

export default function FileUploadModal({
  showUploadModal,
  setShowUploadModal,
  refetch,
  allTags,
  onAppendDocuments,
}: {
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  refetch: () => void;
  allTags?: string[];
  onAppendDocuments?: (docs: DocumentResponse[]) => void;
}) {
  const tooltipContent = (
    <Text variant="sm" color="primary" leading="relaxed">
      1. ファイルを選択 <br />
      2. タグを入力（任意）
      <br /> &nbsp;&nbsp;・タグを付けることで、後に検索しやすくなります。
      <br />
      3.アップロード
      <br />
    </Text>
  );
  return (
    <Modal
      isOpen={showUploadModal}
      title="ファイルアップロード"
      tooltipContent={tooltipContent}
      size="2xl"
      onClose={() => setShowUploadModal(false)}
    >
      <UploadForm
        onUploaded={(docs) => {
          typeof onAppendDocuments === "function" && onAppendDocuments(docs);
          refetch();
          setShowUploadModal(false);
        }}
        allTags={allTags}
      />
    </Modal>
  );
}
