import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: "primary" | "success" | "warning" | "error" | "neutral" | "purple" | "teal";
  size?: "sm" | "md";
  rounded?: "sm" | "md" | "full";
  border?: boolean;
  icon?: ReactNode;
}

const variantClasses = {
  primary: "bg-primary-100 text-primary-800 border-primary-200",
  success: "bg-success-100 text-success-800 border-success-200",
  warning: "bg-warning-100 text-warning-800 border-warning-200",
  error: "bg-error-100 text-error-800 border-error-200",
  neutral: "bg-gray-100 text-gray-800 border-gray-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  teal: "bg-teal-100 text-teal-800 border-teal-200",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

const roundedClasses = {
  sm: "rounded",
  md: "rounded-md",
  full: "rounded-full",
};

export function Badge({
  children,
  variant = "primary",
  size = "sm",
  rounded = "full",
  border = false,
  icon,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium",
        variantClasses[variant],
        sizeClasses[size],
        roundedClasses[rounded],
        border && "border",
        className
      )}
      {...props}
    >
      {children}
      {icon && <span className="ml-1">{icon}</span>}
    </span>
  );
}



