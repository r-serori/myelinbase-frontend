"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signUp,
  confirmSignUp,
  resendSignUpCode,
  signIn,
} from "aws-amplify/auth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { registerSchema, confirmSignUpSchema } from "@/lib/auth-schemas";
import { ZodError } from "zod";

type Step = "REGISTER" | "CONFIRM";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("REGISTER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // nickname or preferred_username
  const [code, setCode] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      registerSchema.parse({ email, password, username });

      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            // Cognitoの設定に合わせてnicknameやpreferred_usernameなどにマッピング
            // 標準的なOIDCプロファイルではnicknameが適切
            nickname: username,
          },
        },
      });

      setStep("CONFIRM");
    } catch (err: any) {
      if (err instanceof ZodError) {
        setError(err.issues[0]?.message ?? "入力内容を確認してください");
      } else {
        console.error(err);
        setError(err.message || "登録中にエラーが発生しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      confirmSignUpSchema.parse({ code });

      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      // 自動ログイン
      await signIn({ username: email, password });
      router.push("/profile");
    } catch (err: any) {
      if (err instanceof ZodError) {
        setError(err.issues[0]?.message ?? "入力内容を確認してください");
      } else {
        console.error(err);
        setError(err.message || "確認コードの検証に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    try {
      await resendSignUpCode({ username: email });
      alert("確認コードを再送信しました");
    } catch (err: any) {
      setError(err.message || "コードの再送信に失敗しました");
    }
  };

  if (step === "CONFIRM") {
    return (
      <AuthLayout
        title="メールアドレスの確認"
        subtitle={`${email} に送信された確認コードを入力してください`}
      >
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              確認コード
            </label>
            <Input
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCode(e.target.value)
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
            {loading ? "確認中..." : "アカウントを有効化"}
          </Button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={handleResendCode}
              className="text-primary hover:underline"
              disabled={loading}
            >
              コードを再送信
            </button>
            <span className="mx-2 text-muted-foreground">|</span>
            <button
              type="button"
              onClick={() => setStep("REGISTER")}
              className="text-muted-foreground hover:underline"
              disabled={loading}
            >
              戻る
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="アカウント作成"
      subtitle="新しいアカウントを作成して始めましょう"
    >
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            ユーザー名
          </label>
          <Input
            type="text"
            placeholder="Taro Yamada"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
            disabled={loading}
          />
        </div>

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
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            パスワード
          </label>
          <Input
            type="password"
            placeholder="8文字以上の英数字"
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
          {loading ? "作成中..." : "アカウント作成"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          すでにアカウントをお持ちですか？{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            ログイン
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
