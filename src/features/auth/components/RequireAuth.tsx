"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/providers/AuthProvider";
import Loading from "@/components/ui/Loading";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading)
    return (
      <div className="h-full flex items-center justify-center">
        <Loading />
      </div>
    );

  return user ? <>{children}</> : null;
}
