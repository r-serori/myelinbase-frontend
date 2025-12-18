import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .max(254, "メールアドレスが長すぎます"),
  password: z
    .string()
    .min(1, "パスワードを入力してください")
    .max(128, "パスワードが長すぎます"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .max(254, "メールアドレスが長すぎます"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上である必要があります")
    .max(128, "パスワードが長すぎます")
    .regex(/[0-9]/, "パスワードには数字を含める必要があります"),
  username: z
    .string()
    .min(1, "ユーザー名を入力してください")
    .max(50, "ユーザー名が長すぎます"),
});

export const confirmSignUpSchema = z.object({
  code: z
    .string()
    .min(1, "確認コードを入力してください")
    .max(20, "確認コードが長すぎます"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .max(254, "メールアドレスが長すぎます"),
});

export const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .min(1, "確認コードを入力してください")
      .max(20, "確認コードが長すぎます"),
    newPassword: z
      .string()
      .min(8, "パスワードは8文字以上である必要があります")
      .max(128, "パスワードが長すぎます")
      .regex(/[0-9]/, "パスワードには数字を含める必要があります"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "確認用パスワードが一致しません",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .min(1, "ニックネームを入力してください")
    .max(50, "ニックネームが長すぎます"),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, "現在のパスワードを入力してください")
      .max(128, "パスワードが長すぎます"),
    newPassword: z
      .string()
      .min(8, "新しいパスワードは8文字以上である必要があります")
      .max(128, "パスワードが長すぎます")
      .regex(/[0-9]/, "新しいパスワードには数字を含める必要があります"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "確認用パスワードが一致しません",
    path: ["confirmNewPassword"],
  });
