import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// コンテナのスタイル定義
const dropdownListVariants = cva(
  "absolute z-60 mt-1 w-full overflow-y-auto rounded-md border bg-white shadow-lg p-1",
  {
    variants: {
      size: {
        default: "max-h-60", // 240px
        xs: "max-h-24", // 96px
        sm: "max-h-32", // 144px
        md: "max-h-44", // 160px
        lg: "max-h-80", // 320px
        xl: "max-h-[50vh]", // 画面の半分
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface DropdownListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownListVariants> {}

// コンテナ
export function DropdownList({
  id,
  children,
  className,
  size,
  ...props
}: DropdownListProps) {
  return (
    <div
      id={id}
      className={cn(dropdownListVariants({ size, className }))}
      {...props}
    >
      {children}
    </div>
  );
}

// アイテムのスタイル定義
const dropdownItemVariants = cva(
  "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1 text-xs outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        default: "text-left hover:bg-gray-100 text-gray-900",
        destructive: "text-red-600 hover:bg-red-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface DropdownItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof dropdownItemVariants> {}

// アイテム
export const DropdownItem = React.forwardRef<
  HTMLButtonElement,
  DropdownItemProps
>(({ className, variant, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(dropdownItemVariants({ variant }), className)}
      {...props}
    />
  );
});
DropdownItem.displayName = "DropdownItem";
