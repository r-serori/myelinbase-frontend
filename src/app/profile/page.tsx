"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import RequireAuth from "@/components/auth/RequireAuth";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { updateProfileSchema, changePasswordSchema } from "@/lib/auth-schemas";
import {
  updateUserAttributes,
  updatePassword,
  fetchUserAttributes,
} from "aws-amplify/auth";
import {
  User as UserIcon,
  Lock,
  LogOut,
  Mail,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";
import { Text } from "../../components/ui/Text";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/ToastProvider";
import Alert from "../../components/ui/Alert";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Profile State
  const [nickname, setNickname] = useState(user?.nickname || ""); // 表示用
  const [email, setEmail] = useState(user?.email || "");

  // Editing State
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [formNickname, setFormNickname] = useState(""); // 編集用
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Modal State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Validation Messages (Alert表示用)
  const [profileValidateMessage, setProfileValidateMessage] = useState<
    string | null
  >(null);
  const [passwordValidateMessage, setPasswordValidateMessage] = useState<
    string | null
  >(null);

  // Password Form State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    async function loadAttributes() {
      try {
        if (process.env.NEXT_PUBLIC_LOGIN_SKIP === "true") {
          setEmail("mock@example.com");
          setNickname("Mock User");
          setFormNickname("Mock User");
          return;
        }
        const attrs = await fetchUserAttributes();
        if (attrs.email) setEmail(attrs.email);
        if (attrs.nickname) {
          setNickname(attrs.nickname);
          setFormNickname(attrs.nickname);
        } else if (user?.nickname) {
          setNickname(user.nickname);
          setFormNickname(user.nickname);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadAttributes();
  }, [user]);

  // 編集開始時にフォームの値を現在の値にリセット
  const startEditingNickname = () => {
    setFormNickname(nickname);
    setIsEditingNickname(true);
    setProfileValidateMessage(null);
  };

  const cancelEditingNickname = () => {
    setIsEditingNickname(false);
    setFormNickname(nickname);
    setProfileValidateMessage(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileValidateMessage(null);
    setLoading(true);

    try {
      // safeParseを使用してバリデーション結果を判定
      // updateProfileSchema は { nickname: string } を期待している
      const result = updateProfileSchema.safeParse({ nickname: formNickname });

      if (!result.success) {
        // バリデーションエラーはAlertで表示
        setProfileValidateMessage(
          result.error.issues[0]?.message ?? "入力エラー"
        );
        setLoading(false);
        return;
      }

      await updateUserAttributes({
        userAttributes: {
          nickname: result.data.nickname,
        },
      });

      // 成功したら表示用ステートを更新して編集モード終了
      setNickname(formNickname);
      setIsEditingNickname(false);

      // API成功メッセージはToastで表示
      showToast({ type: "success", message: "プロフィール情報を更新しました" });
    } catch (err: any) {
      console.error(err);
      // APIエラーはToastで表示
      showToast({
        type: "error",
        message: "プロフィールの更新に失敗しました",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordValidateMessage(null);
    setLoading(true);

    try {
      // safeParseを使用してバリデーション結果を判定
      const result = changePasswordSchema.safeParse({
        oldPassword,
        newPassword,
        confirmNewPassword,
      });

      if (!result.success) {
        // バリデーションエラーはAlertで表示
        setPasswordValidateMessage(
          result.error.issues[0]?.message ?? "入力エラー"
        );
        setLoading(false);
        return;
      }

      await updatePassword({
        oldPassword: result.data.oldPassword,
        newPassword: result.data.newPassword,
      });

      // API成功メッセージはToastで表示
      showToast({ type: "success", message: "パスワードを変更しました" });

      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsChangingPassword(false);
    } catch (err: any) {
      console.error(err);
      // APIエラーはToastで表示
      showToast({
        type: "error",
        message: err.message || "パスワードの変更に失敗しました",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container max-w-2xl mx-auto py-4 px-4">
        {/* Header Section */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="size-12 rounded-full bg-secondary flex items-center justify-center border-2 border-border shadow-sm">
            <UserIcon className="size-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col space-y-2 items-center justify-center">
            <Text variant="h3" weight="semibold">
              {nickname || "No Name"}
            </Text>
            <Text
              variant="muted"
              leading="relaxed"
              className="flex items-center gap-1.5"
            >
              <Mail className="size-3.5" />
              {email}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogoutModalOpen(true)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>

        <Modal
          title="ログアウトしますか？"
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
        >
          <div className="flex justify-end gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              キャンセル
            </Button>
            <Button size="xs" variant="destructive" onClick={logout}>
              ログアウト
            </Button>
          </div>
        </Modal>

        <div className="space-y-6 mt-2">
          {/* Profile Settings Card */}
          <div className="bg-white border border-border/60 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserIcon className="size-4 text-primary" />
                </div>
                <Text variant="lg" weight="semibold">
                  基本情報
                </Text>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Text variant="sm" as="span">
                  メールアドレス
                </Text>
                <Text
                  variant="md"
                  className="px-3 py-2 rounded-md text-muted-foreground"
                >
                  {email}
                </Text>
              </div>

              <div>
                <Text variant="sm" as="label">
                  ニックネーム
                </Text>
                {isEditingNickname ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <Input
                      size="full"
                      value={formNickname}
                      onChange={(e) => setFormNickname(e.target.value)}
                      placeholder="ニックネームを入力"
                      autoFocus
                    />

                    {profileValidateMessage && (
                      <Alert color="destructive">
                        <Text variant="sm" color="destructive">
                          {profileValidateMessage}
                        </Text>
                      </Alert>
                    )}

                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={cancelEditingNickname}
                        disabled={loading}
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="submit"
                        size="xs"
                        disabled={
                          loading ||
                          formNickname.trim() === "" ||
                          formNickname === nickname
                        }
                      >
                        {loading ? "保存中..." : "保存"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <Text variant="md" className="px-3 py-2 truncate">
                      {nickname || "未設定"}
                    </Text>
                    <Button
                      variant="iconSmall"
                      size="icon"
                      onClick={startEditingNickname}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Password Settings Card */}
          <div className="bg-background border border-border/60 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Lock className="size-4 text-warning" />
                </div>
                <Text variant="lg" weight="semibold">
                  パスワードの変更
                </Text>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="h-8"
              >
                {isChangingPassword ? (
                  <>
                    <ChevronUp className="size-4 mr-1" />
                    閉じる
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-4 mr-1" />
                    変更する
                  </>
                )}
              </Button>
            </div>

            {isChangingPassword && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200 pt-2 border-t">
                <form
                  onSubmit={handleChangePassword}
                  className="space-y-4 pt-4"
                >
                  <div className="space-y-2">
                    <Text variant="sm" as="label">
                      現在のパスワード
                    </Text>
                    <Input
                      size="full"
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="現在のパスワードを入力"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Text variant="sm" as="label">
                        新しいパスワード
                      </Text>
                      <Input
                        size="full"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="8文字以上の英数字"
                      />
                    </div>

                    <div className="space-y-2">
                      <Text variant="sm" as="label">
                        確認用入力
                      </Text>
                      <Input
                        size="full"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="もう一度入力"
                      />
                    </div>
                  </div>

                  {passwordValidateMessage && (
                    <Alert color="destructive">
                      <Text variant="sm" color="destructive">
                        {passwordValidateMessage}
                      </Text>
                    </Alert>
                  )}

                  <div className="pt-2 flex justify-end gap-4">
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                        setPasswordValidateMessage(null);
                      }}
                      disabled={loading}
                    >
                      キャンセル
                    </Button>
                    <Button type="submit" size="xs" disabled={loading}>
                      {loading ? "更新中..." : "パスワードを変更"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
