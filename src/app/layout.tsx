import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import AmplifyProvider from "@/features/auth/providers/AmplifyProvider";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import Header from "@/components/ui/Header";

import "./globals.css";

import { MSWProvider } from "@/providers/MSWProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ToastProvider } from "@/providers/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Myelin Base",
  description: "Myelin Base",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-hidden flex flex-col`}
      >
        <MSWProvider>
          <AmplifyProvider>
            <QueryProvider>
              <ToastProvider>
                <AuthProvider>
                  <Header />
                  <main className="flex-1 h-full overflow-hidden relative">
                    {children}
                  </main>
                </AuthProvider>
              </ToastProvider>
            </QueryProvider>
          </AmplifyProvider>
        </MSWProvider>
      </body>
    </html>
  );
}
