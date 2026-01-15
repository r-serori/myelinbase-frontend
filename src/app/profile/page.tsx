"use client";

import { useEffect, useState } from "react";
import {
  fetchUserAttributes,
  updatePassword,
  updateUserAttributes,
} from "aws-amplify/auth";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  LogOut,
  Mail,
  Pencil,
  User as UserIcon,
} from "lucide-react";

import RequireAuth from "@/features/auth/components/RequireAuth";
import { useAuth } from "@/features/auth/providers/AuthProvider";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "@/features/auth/types/index";
import Alert from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { Text } from "@/components/ui/Text";
import { useFormValidation } from "@/hooks/useFormValidation";
import { handleCommonError } from "@/lib/error-handler";

import { useToast } from "@/providers/ToastProvider";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { user, logout, checkUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [email, setEmail] = useState(user?.email || "");

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [formNickname, setFormNickname] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [profileGlobalError, setProfileGlobalError] = useState<string | null>(
    null
  );
  const [passwordGlobalError, setPasswordGlobalError] = useState<string | null>(
    null
  );

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const profileValidation = useFormValidation(updateProfileSchema);
  const passwordValidation = useFormValidation(changePasswordSchema);

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
      } catch {
        showToast({
          type: "error",
          message: "プロフィール情報の取得に失敗しました",
        });
      }
    }
    loadAttributes();
  }, [showToast, user]);

  const startEditingNickname = () => {
    setFormNickname(nickname);
    setIsEditingNickname(true);
    setProfileGlobalError(null);
    profileValidation.clearErrors();
  };

  const cancelEditingNickname = () => {
    setIsEditingNickname(false);
    setFormNickname(nickname);
    setProfileGlobalError(null);
    profileValidation.clearErrors();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileGlobalError(null);

    if (!profileValidation.validateAll({ nickname: formNickname })) {
      return;
    }

    setLoading(true);
    try {
      await updateUserAttributes({
        userAttributes: {
          nickname: formNickname,
        },
      });

      await checkUser();

      setNickname(formNickname);
      setIsEditingNickname(false);

      showToast({ type: "success", message: "プロフィール情報を更新しました" });
    } catch (err: unknown) {
      handleCommonError(
        err,
        setProfileGlobalError,
        showToast,
        "プロフィールの更新に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordGlobalError(null);

    if (
      !passwordValidation.validateAll({
        oldPassword,
        newPassword,
        confirmNewPassword,
      })
    ) {
      return;
    }

    setLoading(true);
    try {
      await updatePassword({
        oldPassword,
        newPassword,
      });

      showToast({ type: "success", message: "パスワードを変更しました" });

      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsChangingPassword(false);
      passwordValidation.clearErrors();
    } catch {
      showToast({
        type: "error",
        message: "パスワードの変更に失敗しました。再度お試しください。",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container max-w-2xl mx-auto py-4 px-4">
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
                <Text variant="md" as="span">
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
                <Text variant="md" as="label">
                  ユーザー名
                </Text>
                {isEditingNickname ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <FormField
                      label=""
                      error={profileValidation.errors.nickname}
                      htmlFor="nickname"
                    >
                      <Input
                        id="nickname"
                        size="full"
                        name="name"
                        autoComplete="name"
                        value={formNickname}
                        onChange={(e) => setFormNickname(e.target.value)}
                        onBlur={() =>
                          profileValidation.validateField(
                            "nickname",
                            formNickname
                          )
                        }
                        placeholder="ユーザー名を入力"
                        autoFocus
                      />
                    </FormField>

                    {profileGlobalError && (
                      <Alert color="destructive">
                        <Text variant="sm" color="destructive">
                          {profileGlobalError}
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
                        className="flex items-center gap-2"
                        disabled={
                          loading ||
                          formNickname.trim() === "" ||
                          formNickname === nickname
                        }
                      >
                        {loading && <Spinner size="3" color="white" />}
                        保存
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
                  <FormField
                    label="現在のパスワード"
                    error={passwordValidation.errors.oldPassword}
                    required
                    htmlFor="oldPassword"
                  >
                    <Input
                      id="oldPassword"
                      name="oldPassword"
                      size="full"
                      type="password"
                      autoComplete="current-password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      onBlur={() =>
                        passwordValidation.validateField(
                          "oldPassword",
                          oldPassword
                        )
                      }
                      placeholder="現在のパスワードを入力"
                    />
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="新しいパスワード"
                      error={passwordValidation.errors.newPassword}
                      required
                      htmlFor="newPassword"
                    >
                      <Input
                        id="newPassword"
                        name="newPassword"
                        size="full"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onBlur={() =>
                          passwordValidation.validateField(
                            "newPassword",
                            newPassword
                          )
                        }
                        placeholder="8文字以上の英数字"
                      />
                    </FormField>

                    <FormField
                      label="確認用入力"
                      error={passwordValidation.errors.confirmNewPassword}
                      required
                      htmlFor="confirmNewPassword"
                    >
                      <Input
                        id="confirmNewPassword"
                        name="confirmNewPassword"
                        size="full"
                        type="password"
                        autoComplete="new-password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        onBlur={() =>
                          passwordValidation.validateField(
                            "confirmNewPassword",
                            confirmNewPassword
                          )
                        }
                        placeholder="もう一度入力"
                      />
                    </FormField>
                  </div>

                  {passwordGlobalError && (
                    <Alert color="destructive">
                      <Text variant="sm" color="destructive">
                        {passwordGlobalError}
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
                        setPasswordGlobalError(null);
                        passwordValidation.clearErrors();
                      }}
                      disabled={loading}
                    >
                      キャンセル
                    </Button>
                    <Button
                      type="submit"
                      size="xs"
                      className="flex items-center gap-2"
                      disabled={
                        loading ||
                        !oldPassword ||
                        !newPassword ||
                        !confirmNewPassword
                      }
                    >
                      {loading && <Spinner size="3" color="white" />}
                      パスワードを変更
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
