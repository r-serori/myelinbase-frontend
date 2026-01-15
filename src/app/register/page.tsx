"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  confirmSignUp,
  resendSignUpCode,
  signIn,
  signUp,
} from "@aws-amplify/auth";

import AuthLayout from "@/features/auth/components/AuthLayout";
import { useAuth } from "@/features/auth/providers/AuthProvider";
import {
  confirmSignUpSchema,
  registerSchema,
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

type Step = "REGISTER" | "CONFIRM";

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("REGISTER");
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && process.env.NEXT_PUBLIC_LOGIN_SKIP !== "true") {
      router.push("/chat");
    }
  }, [user, isLoading, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");

  const registerValidation = useFormValidation(registerSchema);
  const confirmValidation = useFormValidation(confirmSignUpSchema);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!registerValidation.validateAll({ email, password, nickname })) {
      return;
    }

    setLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            nickname,
          },
        },
      });

      setStep("CONFIRM");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "UsernameExistsException") {
        setGlobalError("このメールアドレスは既に登録されています");
      } else {
        handleCommonError(
          err,
          setGlobalError,
          showToast,
          "登録中にエラーが発生しました"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!confirmValidation.validateAll({ code })) {
      return;
    }

    setLoading(true);
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      await signIn({ username: email, password });
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
          "確認コードの検証に失敗しました"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setGlobalError(null);
    try {
      await resendSignUpCode({ username: email });
      showToast({ type: "success", message: "確認コードを再送信しました" });
    } catch (err: unknown) {
      handleCommonError(
        err,
        setGlobalError,
        showToast,
        "コードの再送信に失敗しました"
      );
    }
  };

  if (step === "CONFIRM") {
    return (
      <AuthLayout
        title="メールアドレスの確認"
        subtitle={`${email} に送信された確認コードを入力してください`}
      >
        <form onSubmit={handleConfirm} className="space-y-4">
          <FormField
            label="確認コード"
            error={confirmValidation.errors.code}
            required
            htmlFor="code"
          >
            <Input
              id="code"
              name="code"
              type="text"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCode(e.target.value)
              }
              onBlur={() => confirmValidation.validateField("code", code)}
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
            disabled={loading || !code}
          >
            {loading && <Spinner size="3.5" color="white" />}
            アカウントを有効化
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
        <FormField
          label="ユーザー名"
          error={registerValidation.errors.nickname}
          required
          htmlFor="nickname"
        >
          <Input
            id="nickname"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Taro Yamada"
            value={nickname}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNickname(e.target.value)
            }
            onBlur={() =>
              registerValidation.validateField("nickname", nickname)
            }
            disabled={loading}
          />
        </FormField>

        <FormField
          label="メールアドレス"
          error={registerValidation.errors.email}
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
            onBlur={() => registerValidation.validateField("email", email)}
            disabled={loading}
          />
        </FormField>

        <FormField
          label="パスワード"
          error={registerValidation.errors.password}
          required
          htmlFor="password"
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="8文字以上の英数字"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            onBlur={() =>
              registerValidation.validateField("password", password)
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
          disabled={loading || !nickname || !email || !password}
        >
          {loading && <Spinner size="3.5" color="white" />}
          アカウント作成
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
