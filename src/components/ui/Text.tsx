"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const textVariants = cva("transition-colors", {
  variants: {
    variant: {
      default: "text-base leading-relaxed",
      p: "text-base leading-7 [&:not(:first-child)]:mt-6",
      h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-7xl",
      h2: "scroll-m-20 text-3xl font-semibold tracking-tight",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight",
      lead: "text-xl text-muted-foreground",
      xs: "text-[10px] font-medium leading-none",
      sm: "text-xs font-medium leading-none",
      md: "text-sm font-medium leading-none",
      lg: "text-lg font-semibold",
      xl: "text-xl font-semibold",
      muted: "text-sm text-muted-foreground",
      code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground",
      quote: "mt-6 border-l-2 pl-6 italic text-muted-foreground",
    },
    color: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      destructive: "text-destructive",
      success: "text-green-600",
      warning: "text-amber-600",
      white: "text-white",
    },
    leading: {
      default: "leading-none",
      relaxed: "leading-relaxed",
    },
    weight: {
      default: "",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
  },
  defaultVariants: {
    variant: "default",
    color: "default",
    weight: "default",
    align: "left",
    leading: "default",
  },
});

export interface TextProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  as?: React.ElementType;
  htmlFor?: string;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      className,
      variant,
      color,
      weight,
      leading,
      align,
      htmlFor,
      as: Component = "p",
      ...props
    },
    ref
  ) => {
    const Comp = Component as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    return (
      <Comp
        className={cn(
          textVariants({ variant, color, weight, leading, align, className })
        )}
        ref={ref}
        htmlFor={htmlFor}
        {...props}
      />
    );
  }
);
Text.displayName = "Text";

export { Text, textVariants };
