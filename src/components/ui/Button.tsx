import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium shadow-sm transition-colors transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer gap-0.5 disabled:shadow-none",

  {
    variants: {
      variant: {
        default:
          "border border-primary bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-primary/70",
        destructive:
          "border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-destructive/70 disabled:hover:bg-destructive/70 font-bold",
        outlinePrimary:
          "bg-muted/20 text-muted-foreground border-border hover:text-primary hover:border-primary/50 hover:bg-primary/5 disabled:bg-muted disabled:text-muted-foreground  disabled:hover:bg-muted/20 border",
        outline:
          "border border-border bg-muted/20 text-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 disabled:hover:bg-muted/20",
        outlineBlack:
          "border border-foreground bg-background text-foreground hover:bg-accent hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        iconSmall:
          "rounded-full border border-none text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-none",
        ghost: "hover:bg-accent hover:text-accent-foreground shadow-none",
        link: "text-primary hover:underline shadow-none",
        close:
          "rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-none disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground",
        tag: "rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30 shadow-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        link: "p-0",
        xxs: "h-5 px-1.5 py-0.5 text-xs",
        xs: "h-7 px-2 py-1 text-xs",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        iconSmall: "h-4 w-4",
        close: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
