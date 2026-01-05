import React from "react";

/**
 * フォームフィールドの共通コンポーネント
 * ラベル、入力欄、エラーメッセージを統一的に表示
 *
 * @example
 * ```tsx
 * <FormField label="メールアドレス" error={errors.email} required>
 *   <Input
 *     type="email"
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *     onBlur={() => validateField("email", email)}
 *   />
 * </FormField>
 * ```
 */
export type FormFieldProps = {
  /** ラベルテキスト */
  label: string;
  /** エラーメッセージ（エラーがない場合はundefined） */
  error?: string;
  /** 子要素（Inputなどのフォーム要素） */
  children: React.ReactNode;
  /** 必須フィールドかどうか */
  required?: boolean;
  /** ラベルのhtmlFor属性 */
  htmlFor?: string;
  /** 追加のクラス名 */
  className?: string;
  /** ラベルの追加要素（パスワードを忘れた？リンクなど） */
  labelExtra?: React.ReactNode;
};

export function FormField({
  label,
  error,
  children,
  required = false,
  htmlFor,
  className = "",
  labelExtra,
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {labelExtra}
      </div>
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
