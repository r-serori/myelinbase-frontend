import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

import { cn } from "@/lib/utils";

export type AlertColor =
  | "default"
  | "primary"
  | "warning"
  | "destructive"
  | "success";

function Alert({
  color = "default",
  iconAlign = "center",
  children,
  className,
}: {
  color?: AlertColor;
  iconAlign?: "start" | "center" | "end";
  children: React.ReactNode;
  className?: string;
}) {
  const iconAlignClass = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
  };
  const colors: Record<AlertColor, string> = {
    default: "bg-background text-foreground border border-border",
    primary: "bg-primary/5 text-primary border border-primary/20",
    warning: "bg-warning/5 text-warning border border-warning/20",
    destructive:
      "bg-destructive/5 text-destructive border border-destructive/20",
    success: "bg-success/10 text-success border border-success/20",
  };
  return (
    <div
      className={cn(
        "my-2 p-2 rounded-md flex gap-2",
        iconAlignClass[iconAlign],
        colors[color],
        className
      )}
      role="alert"
    >
      {color === "destructive" && (
        <AlertCircle className="size-4 shrink-0 text-destructive" />
      )}
      {color === "warning" && (
        <AlertTriangle className="size-4 shrink-0 text-warning" />
      )}
      {color === "success" && (
        <CheckCircle className="size-4 shrink-0 text-success" />
      )}
      {(color === "primary" || color === "default") && (
        <Info className="size-4 shrink-0 text-primary" />
      )}
      {children}
    </div>
  );
}

export default Alert;
