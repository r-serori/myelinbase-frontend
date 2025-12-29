import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-white shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-9 px-3 py-1 text-sm",
        xs: "h-7 px-1.5 py-0.5 text-[10px] md:w-40",
        sm: "h-7 px-2 w-60 text-xs",
        md: "h-7 px-2.5 w-80 text-sm",
        lg: "h-7 px-4 w-100 text-base",
        full: "px-2 py-1 w-full text-base",
        checkbox: "cursor-pointer",
        radio: "cursor-pointer",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
export default Input;
