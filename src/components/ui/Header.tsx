"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Folder, User as UserIcon } from "lucide-react";

import { useAuth } from "@/features/auth/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

export default function Header() {
  const pathname = usePathname();
  const { isLoading, user } = useAuth();

  const isTitlePage = pathname === "/";
  const isLoginPage = pathname === "/login/" || pathname === "/login";
  const isRegisterPage = pathname === "/register" || pathname === "/register/";
  const isForgotPasswordPage =
    pathname === "/forgot-password" || pathname === "/forgot-password/";

  if (isTitlePage || isLoginPage || isRegisterPage || isForgotPasswordPage)
    return null;

  if (isLoading) return null;

  if (!user) return null;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <>
      <div className="h-12 w-full" aria-hidden="true" />

      <header className="fixed top-0 left-0 right-0 z-30 bg-secondary w-full">
        <div className="px-4 h-12 flex items-center justify-between mx-auto max-w-6xl">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-bold tracking-tight hover:opacity-70 transition-opacity flex items-center gap-2"
            >
              Myelin Base
            </Link>

            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/chat"
                className={`px-3 py-1.5 rounded-md transition-all duration-200 ${
                  isActive("/chat")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Bot className="size-4" />
                  <span>チャット</span>
                </div>
              </Link>
              <Link
                href="/documents"
                className={`px-3 py-1.5 rounded-md transition-all duration-200 ${
                  isActive("/documents")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Folder className="size-4" />
                  <span>文書管理</span>
                </div>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button
                variant="close"
                size="close"
                className={`flex items-center gap-2 px-2 hover:bg-muted/50 ${
                  isActive("/profile")
                    ? "bg-muted/50 text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <UserIcon className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
