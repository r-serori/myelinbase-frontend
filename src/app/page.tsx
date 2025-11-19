"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";

export default function Root() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
          router.replace("/chat");
          return;
        }
        await getCurrentUser();
        router.replace("/chat");
      } catch {
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black sm:items-start">
        {checking ? (
          <span className="text-sm text-gray-500">Checking session...</span>
        ) : null}
      </main>
    </div>
  );
}
