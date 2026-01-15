import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください")
    .max(254, "メールアドレスは254文字以内で入力してください"),
  password: z
    .string()
    .min(1, "パスワードを入力してください")
    .min(8, "パスワードは8文字以上である必要があります")
    .regex(/[0-9]/, "パスワードには数字を含める必要があります")
    .regex(/[A-Z]/, "パスワードには大文字を含める必要があります")
    .max(128, "パスワードは128文字以内で入力してください"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください")
    .max(254, "メールアドレスは254文字以内で入力してください"),
  password: z
    .string()
    .min(1, "パスワードを入力してください")
    .min(8, "パスワードは8文字以上である必要があります")
    .max(128, "パスワードは128文字以内で入力してください")
    .regex(/[0-9]/, "パスワードには数字を含める必要があります")
    .regex(/[A-Z]/, "パスワードには大文字を含める必要があります"),
  nickname: z
    .string()
    .min(1, "ユーザー名を入力してください")
    .max(50, "ユーザー名は50文字以内で入力してください"),
});

export const confirmSignUpSchema = z.object({
  code: z
    .string()
    .min(1, "確認コードを入力してください")
    .max(20, "確認コードは20文字以内で入力してください"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください")
    .max(254, "メールアドレスは254文字以内で入力してください"),
});

export const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .min(1, "確認コードを入力してください")
      .max(20, "確認コードは20文字以内で入力してください"),
    newPassword: z
      .string()
      .min(1, "パスワードを入力してください")
      .min(8, "パスワードは8文字以上である必要があります")
      .max(128, "パスワードは128文字以内で入力してください")
      .regex(/[0-9]/, "パスワードには数字を含める必要があります")
      .regex(/[A-Z]/, "パスワードには大文字を含める必要があります"),
    confirmPassword: z
      .string()
      .min(1, "確認用パスワードを入力してください")
      .min(8, "確認用パスワードは8文字以上である必要があります")
      .regex(/[0-9]/, "確認用パスワードには数字を含める必要があります")
      .regex(/[A-Z]/, "確認用パスワードには大文字を含める必要があります")
      .max(128, "確認用パスワードは128文字以内で入力してください"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "確認用パスワードが一致しません",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .min(1, "ユーザー名を入力してください")
    .max(50, "ユーザー名は50文字以内で入力してください"),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, "現在のパスワードを入力してください")
      .min(8, "パスワードは8文字以上である必要があります")
      .regex(/[0-9]/, "パスワードには数字を含める必要があります")
      .regex(/[A-Z]/, "パスワードには大文字を含める必要があります")
      .max(128, "現在のパスワードは128文字以内で入力してください"),
    newPassword: z
      .string()
      .min(1, "新しいパスワードを入力してください")
      .min(8, "新しいパスワードは8文字以上である必要があります")
      .max(128, "新しいパスワードは128文字以内で入力してください")
      .regex(/[0-9]/, "新しいパスワードには数字を含める必要があります")
      .regex(/[A-Z]/, "新しいパスワードには大文字を含める必要があります"),
    confirmNewPassword: z
      .string()
      .min(1, "確認用パスワードを入力してください")
      .min(8, "確認用パスワードは8文字以上である必要があります")
      .regex(/[0-9]/, "確認用パスワードには数字を含める必要があります")
      .regex(/[A-Z]/, "確認用パスワードには大文字を含める必要があります")
      .max(128, "確認用パスワードは128文字以内で入力してください"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "確認用パスワードが一致しません",
    path: ["confirmNewPassword"],
  });
