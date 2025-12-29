"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "aws-amplify/auth";

import AuthLayout from "@/features/auth/components/AuthLayout";
import { loginSchema } from "@/features/auth/types/index";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { handleCommonError } from "@/lib/error-handler";

import { useToast } from "@/providers/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      loginSchema.parse({ email, password });

      if (process.env.NEXT_PUBLIC_LOGIN_SKIP === "true") {
      } else {
        await signIn({ username: email, password });
      }

      router.push("/chat");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "UserNotFoundException") {
        setError("ユーザーが見つかりません");
      } else if (
        err instanceof Error &&
        err.name === "NotAuthorizedException"
      ) {
        setError("メールアドレスまたはパスワードが正しくありません");
      } else {
        handleCommonError(err, setError, showToast, "ログインに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="ログイン" subtitle="アカウントにサインインしてください">
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            メールアドレス
          </label>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              パスワード
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              パスワードをお忘れですか？
            </Link>
          </div>
          <Input
            type="password"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          アカウントをお持ちでないですか？{" "}
          <Link
            href="/register"
            className="text-primary hover:underline font-medium"
          >
            アカウント作成
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
