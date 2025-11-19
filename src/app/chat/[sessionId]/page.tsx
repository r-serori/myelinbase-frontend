import RequireAuth from "@/components/auth/RequireAuth";
import ClientPage from "./ClientPage";

export async function generateStaticParams() {
  // output: 'export' のため動的ルートはビルド時にパラメータ列挙が必要。
  // ここでは空配列を返し、直接アクセスはS3のSPAリライト + クライアント遷移で処理する。
  return [];
}

export default function SessionDetailPage() {
  return (
    <RequireAuth>
      <ClientPage />
    </RequireAuth>
  );
}
