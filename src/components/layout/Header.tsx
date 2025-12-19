"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <header className="sticky top-0 z-99 border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-sm">
            Myelin
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/chat"
              className={`px-3 py-1.5 rounded ${
                isActive("/chat")
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              チャット
            </Link>
            <Link
              href="/documents"
              className={`px-3 py-1.5 rounded ${
                isActive("/documents")
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              文書管理
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
