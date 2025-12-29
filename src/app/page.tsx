"use client";

import { useEffect, useState } from "react";
import { Orbitron } from "next/font/google"; // ★ 追加: フォントのインポート
import { useRouter } from "next/navigation";
import { ArrowRight, MousePointerClick, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "../components/ui/Button";
import { Text } from "../components/ui/Text";
// 型定義だけは通常通りインポートしてOK
import type { IntroPhase } from "../components/ui/ThreeTitleLogo";
import ThreeTitleLogo from "../components/ui/ThreeTitleLogo";

// ★ 追加: フォントの設定
const titleFont = Orbitron({
  weight: ["600", "700"], // 太字を使用
  subsets: ["latin"],
  display: "swap",
});

export default function TitlePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<IntroPhase>("INIT");

  // オープニングシーケンス
  useEffect(() => {
    const sequence = async () => {
      // 1. INIT: 三角錐のみ (0s)

      // 2. ATTACK: 攻撃開始 (1.0s)
      await new Promise((r) => setTimeout(r, 500));
      setPhase("ATTACK");

      // 3. DEFEND: バリア展開 (1.5s)
      await new Promise((r) => setTimeout(r, 500));
      setPhase("DEFEND");

      // 4. SHOW_TITLE: タイトル表示 (2.5s)
      await new Promise((r) => setTimeout(r, 1000));
      setPhase("SHOW_TITLE");
    };

    sequence();
  }, []);

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Text
        variant="h1"
        as="h1"
        className={`text-center absolute md:top-10 top-14 left-0 right-0 z-10 select-none text-shadow-lg ${
          phase === "SHOW_TITLE"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        } ${titleFont.className}`}
      >
        Myelin Base
      </Text>
      <div className="h-full w-full inset-0 z-0">
        <ThreeTitleLogo phase={phase} />
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-16 pointer-events-none">
        <div
          className={cn(
            "text-center transition-all duration-1000 ease-out transform",
            phase === "SHOW_TITLE"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          )}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground animate-pulse mb-6">
            <MousePointerClick className="size-5" />
            <Text variant="md">Click Screen!</Text>
          </div>
          <div className="pointer-events-auto animate-in fade-in zoom-in duration-500 delay-1000 fill-mode-forwards mt-4">
            <Button
              size="lg"
              className="px-8 py-6 text-lg rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105 bg-foreground text-background hover:bg-foreground/80"
              onClick={handleLogin}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "absolute md:top-8 md:right-8 top-2 right-2 z-20 transition-opacity duration-1000 delay-500",
          phase === "SHOW_TITLE" ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-2 backdrop-blur-md rounded-full border border-foreground/60 shadow-sm text-foreground/80 animate-pulse">
          <ShieldCheck className="size-4" />
          <Text variant="md">System Online</Text>
        </div>
      </div>
    </div>
  );
}
