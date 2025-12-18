"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, fetchUserAttributes, signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

// ユーザー情報の型定義
interface User {
  userId: string;
  username: string; // Cognitoのusername (sub or unique ID)
  nickname?: string; // 表示用の名前
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
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

      // 1. セッションがあるか確認
      const currentUser = await getCurrentUser();

      // 2. 詳細な属性（nicknameなど）を取得
      const attributes = await fetchUserAttributes();

      setUser({
        userId: currentUser.userId,
        username: currentUser.username,
        email: attributes.email,
        nickname: attributes.nickname,
      });
    } catch (error) {
      // console.log("Not signed in");
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
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
