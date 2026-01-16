"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserAttributes, getCurrentUser, signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

import { useToast } from "@/providers/ToastProvider";

interface User {
  userId: string;
  username: string;
  nickname?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  checkUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
  checkUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    checkUser();

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      const { event } = payload;
      if (event === "signedIn") {
        checkUser();
      } else if (event === "signedOut") {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  async function checkUser() {
    try {
      if (process.env.NEXT_PUBLIC_LOGIN_SKIP === "true") {
        setUser({
          userId: "mock",
          email: "mock@example.com",
          username: "MockUser",
          nickname: "Mock User",
        });
        setIsLoading(false);
        return;
      }

      const currentUser = await getCurrentUser();

      const attributes = await fetchUserAttributes();

      setUser({
        userId: currentUser.userId,
        username: currentUser.username,
        email: attributes.email,
        nickname: attributes.nickname,
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      router.push("/login");
    } catch {
      showToast({ type: "error", message: "ログアウトに失敗しました" });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, checkUser }}>
      {children}
    </AuthContext.Provider>
  );
};
