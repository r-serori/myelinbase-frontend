import { useState } from "react";
import { ZodError, ZodType } from "zod";

/**
 * Zodスキーマを使用したフォームバリデーションフック
 *
 * @template T - フォームデータの型
 * @param schema - Zodスキーマ
 * @returns バリデーション関数とエラー状態
 */
export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodType<T>
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  /**
   * 個別フィールドのバリデーション
   * @param field - フィールド名
   * @param value - フィールドの値
   * @returns バリデーション成功時はtrue
   */
  const validateField = (field: keyof T, value: unknown): boolean => {
    try {
      schema.parse({ [field]: value } as Partial<T>);

      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldError = err.issues.find((error) =>
          error.path.includes(field as string)
        );
        if (fieldError) {
          setErrors((prev) => ({
            ...prev,
            [field]: fieldError.message,
          }));
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
        }
      }
      return false;
    }
  };

  /**
   * 全フィールドのバリデーション（submit時に使用）
   * @param data - 全フォームデータ
   * @returns バリデーション成功時はtrue
   */
  const validateAll = (data: T): boolean => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        err.issues.forEach((error) => {
          const key = error.path[0] as keyof T;
          if (key && !newErrors[key]) {
            newErrors[key] = error.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  /**
   * 全エラーをクリア
   */
  const clearErrors = () => setErrors({});

  /**
   * 特定フィールドのエラーをクリア
   * @param field - フィールド名
   */
  const clearError = (field: keyof T) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /**
   * エラーが存在するかチェック
   */
  const hasErrors = Object.values(errors).some((e) => !!e);

  return {
    errors,
    validateField,
    validateAll,
    clearErrors,
    clearError,
    hasErrors,
  };
}
