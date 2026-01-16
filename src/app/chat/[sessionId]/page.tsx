import { redirect } from "next/navigation";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  redirect(`/chat?sessionId=${encodeURIComponent(sessionId)}`);
}
