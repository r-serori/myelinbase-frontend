"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@aws-amplify/auth";

import AuthLayout from "@/features/auth/components/AuthLayout";
import { useAuth } from "@/features/auth/providers/AuthProvider";
import { loginSchema } from "@/features/auth/types/index";
import Alert from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { Text } from "@/components/ui/Text";
import { useFormValidation } from "@/hooks/useFormValidation";

import { useToast } from "@/providers/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, checkUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && process.env.NEXT_PUBLIC_LOGIN_SKIP !== "true") {
      router.push("/documents");
    }
  }, [user, isLoading, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { errors, validateField, validateAll } = useFormValidation(loginSchema);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateAll({ email, password })) {
      return;
    }

    setLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_LOGIN_SKIP === "true") {
        router.push("/documents");
      } else {
        await signIn({ username: email, password });
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.name === "UserAlreadyAuthenticatedException"
      ) {
        await checkUser();
        router.push("/documents");
      } else {
        showToast({
          type: "error",
          message:
            "ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="ログイン" subtitle="アカウントにサインインしてください">
      <form onSubmit={handleLogin} className="space-y-4">
        <FormField
          label="メールアドレス"
          error={errors.email}
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
            onBlur={() => validateField("email", email)}
            disabled={loading}
          />
        </FormField>

        <FormField
          label="パスワード"
          error={errors.password}
          required
          htmlFor="password"
          labelExtra={
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              パスワードをお忘れですか？
            </Link>
          }
        >
          <Input
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="パスワードを入力"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            onBlur={() => validateField("password", password)}
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
          disabled={loading || !email || !password}
        >
          {loading && <Spinner size="3.5" color="white" />}
          ログイン
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
