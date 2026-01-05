import React from "react";
import Image from "next/image";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 mb-6 group">
            <Image
              src="/images/icon.png"
              alt="Myelin Base"
              width={56}
              height={56}
            />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="bg-background border border-border/50 shadow-sm rounded-xl p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
