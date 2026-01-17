import { z } from "zod";

/**
 * 共通のパスワードバリデーションを生成する関数
 * @param fieldName エラーメッセージに表示する項目名（例: "パスワード", "新しいパスワード"）
 */
const createPasswordSchema = (fieldName: string) =>
  z
    .string()
    .min(1, `${fieldName}を入力してください`)
    .min(8, `${fieldName}は8文字以上である必要があります`)
    .max(128, `${fieldName}は128文字以内で入力してください`)
    .regex(/[0-9]/, `${fieldName}には数字を含める必要があります`)
    .regex(/[A-Z]/, `${fieldName}には大文字を含める必要があります`)
    .regex(
      /[^a-zA-Z0-9]/,
      `${fieldName}には記号(! @ # など)を含める必要があります`
    );

/**
 * 共通のメールアドレススキーマ
 */
const commonEmailSchema = z
  .string()
  .min(1, "メールアドレスを入力してください")
  .email("有効なメールアドレスを入力してください")
  .max(254, "メールアドレスは254文字以内で入力してください");

/**
 * 共通のニックネームスキーマ
 */
const commonNicknameSchema = z
  .string()
  .min(1, "ユーザー名を入力してください")
  .max(50, "ユーザー名は50文字以内で入力してください");

/**
 * 共通の確認コードスキーマ
 */
const commonCodeSchema = z
  .string()
  .min(1, "確認コードを入力してください")
  .max(20, "確認コードは20文字以内で入力してください");

// --- 各フォーム用スキーマ定義 ---

export const loginSchema = z.object({
  email: commonEmailSchema,
  password: createPasswordSchema("パスワード"),
});

export const registerSchema = z.object({
  email: commonEmailSchema,
  password: createPasswordSchema("パスワード"),
  nickname: commonNicknameSchema,
});

export const confirmSignUpSchema = z.object({
  code: commonCodeSchema,
});

export const forgotPasswordSchema = z.object({
  email: commonEmailSchema,
});

export const resetPasswordSchema = z
  .object({
    code: commonCodeSchema,
    newPassword: createPasswordSchema("パスワード"),
    confirmPassword: createPasswordSchema("確認用パスワード"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "確認用パスワードが一致しません",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  nickname: commonNicknameSchema,
});

export const changePasswordSchema = z
  .object({
    oldPassword: createPasswordSchema("現在のパスワード"),
    newPassword: createPasswordSchema("新しいパスワード"),
    confirmNewPassword: createPasswordSchema("確認用パスワード"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "確認用パスワードが一致しません",
    path: ["confirmNewPassword"],
  });
