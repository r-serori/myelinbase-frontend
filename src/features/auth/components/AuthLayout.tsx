import React from "react";
import Link from "next/link";
import { BrainCircuit } from "lucide-react";

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
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <BrainCircuit className="w-8 h-8 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Myelin Base
            </span>
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
