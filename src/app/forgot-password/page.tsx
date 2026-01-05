"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confirmResetPassword, resetPassword } from "aws-amplify/auth";

import AuthLayout from "@/features/auth/components/AuthLayout";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/features/auth/types/index";
import Alert from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { Text } from "@/components/ui/Text";
import { useFormValidation } from "@/hooks/useFormValidation";
import { handleCommonError } from "@/lib/error-handler";

import { useToast } from "@/providers/ToastProvider";

type Step = "REQUEST" | "RESET";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>("REQUEST");
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const requestValidation = useFormValidation(forgotPasswordSchema);
  const resetValidation = useFormValidation(resetPasswordSchema);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!requestValidation.validateAll({ email })) {
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ username: email });
      setStep("RESET");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "UserNotFoundException") {
        setGlobalError("ユーザーが見つかりません");
      } else if (
        err instanceof Error &&
        err.name === "LimitExceededException"
      ) {
        setGlobalError(
          "試行回数が上限を超えました。しばらく待ってから再度お試しください"
        );
      } else {
        handleCommonError(
          err,
          setGlobalError,
          showToast,
          "リセットコードの送信に失敗しました"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!resetValidation.validateAll({ code, newPassword, confirmPassword })) {
      return;
    }

    setLoading(true);
    try {
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
      if (err instanceof Error && err.name === "CodeMismatchException") {
        setGlobalError("確認コードが正しくありません");
      } else if (err instanceof Error && err.name === "ExpiredCodeException") {
        setGlobalError(
          "確認コードの有効期限が切れています。再送信してください"
        );
      } else {
        handleCommonError(
          err,
          setGlobalError,
          showToast,
          "パスワードのリセットに失敗しました"
        );
      }
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
          <FormField
            label="確認コード"
            error={resetValidation.errors.code}
            required
            htmlFor="code"
          >
            <Input
              id="code"
              type="text"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCode(e.target.value)
              }
              onBlur={() => resetValidation.validateField("code", code)}
              disabled={loading}
            />
          </FormField>

          <FormField
            label="新しいパスワード"
            error={resetValidation.errors.newPassword}
            required
            htmlFor="newPassword"
          >
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="8文字以上の英数字"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewPassword(e.target.value)
              }
              onBlur={() =>
                resetValidation.validateField("newPassword", newPassword)
              }
              disabled={loading}
            />
          </FormField>

          <FormField
            label="パスワード（確認）"
            error={resetValidation.errors.confirmPassword}
            required
            htmlFor="confirmPassword"
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="同じパスワードを入力"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              onBlur={() =>
                resetValidation.validateField(
                  "confirmPassword",
                  confirmPassword
                )
              }
              disabled={loading}
            />
          </FormField>

          {globalError && (
            <Alert color="destructive">
              <Text variant="sm" color="destructive">
                {globalError}
              </Text>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2"
            disabled={loading || !code || !newPassword || !confirmPassword}
          >
            {loading && <Spinner size="3.5" color="white" />}
            パスワードを変更
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
        <FormField
          label="メールアドレス"
          error={requestValidation.errors.email}
          required
          htmlFor="email"
        >
          <Input
            id="email"
            name="username"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            onBlur={() => requestValidation.validateField("email", email)}
            disabled={loading}
          />
        </FormField>

        {globalError && (
          <Alert color="destructive">
            <Text variant="sm" color="destructive">
              {globalError}
            </Text>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full flex items-center justify-center gap-2"
          disabled={loading || !email}
        >
          {loading && <Spinner size="3.5" color="white" />}
          コードを送信
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
