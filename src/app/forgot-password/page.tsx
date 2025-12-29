"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmResetPassword, resetPassword } from "aws-amplify/auth";
import { ZodError } from "zod";

import AuthLayout from "@/features/auth/components/AuthLayout";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/features/auth/types/index";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { handleCommonError } from "@/lib/error-handler";

import { useToast } from "@/providers/ToastProvider";

type Step = "REQUEST" | "RESET";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>("REQUEST");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      forgotPasswordSchema.parse({ email });
      await resetPassword({ username: email });
      setStep("RESET");
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        setError(err.issues[0]?.message ?? "入力内容を確認してください");
      } else {
        console.error(err);
        setError(
          (err as Error).message ?? "リセットコードの送信に失敗しました"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      resetPasswordSchema.parse({ code, newPassword, confirmPassword });

      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });

      showToast({
        type: "success",
        message:
          "パスワードを変更しました。新しいパスワードでログインしてください。",
      });
      router.push("/login");
    } catch (err: unknown) {
      handleCommonError(
        err,
        setError,
        showToast,
        "パスワードのリセットに失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === "RESET") {
    return (
      <AuthLayout
        title="新しいパスワードの設定"
        subtitle="確認コードと新しいパスワードを入力してください"
      >
        <form onSubmit={handleConfirmReset} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
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

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              新しいパスワード
            </label>
            <Input
              type="password"
              placeholder="8文字以上の英数字"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewPassword(e.target.value)
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              パスワード（確認）
            </label>
            <Input
              type="password"
              placeholder="同じパスワードを入力"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
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
            {loading ? "変更中..." : "パスワードを変更"}
          </Button>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setStep("REQUEST")}
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
      title="パスワードをお忘れですか？"
      subtitle="登録したメールアドレスを入力してください。リセット用のコードを送信します。"
    >
      <form onSubmit={handleRequestReset} className="space-y-4">
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

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "コードを送信" : "コードを送信"}
        </Button>

        <div className="text-center text-sm">
          <Link href="/login" className="text-muted-foreground hover:underline">
            ログイン画面に戻る
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
