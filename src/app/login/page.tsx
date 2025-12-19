"use client";
import { signIn } from "aws-amplify/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      // 実API: Amplify Auth
      // await signIn({ username: email, password });
      // モックモード: Amplifyを呼ばずに通過
      if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
        // no-op
      } else {
        await signIn({ username: email, password });
      }
      router.push("/chat");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <form onSubmit={onLogin} className="space-y-3">
        <input
          className="border rounded p-2 w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border rounded p-2 w-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="border rounded p-2 w-full">Login</button>
      </form>
    </div>
  );
}
