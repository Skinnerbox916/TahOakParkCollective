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
  primary: "bg-indigo-100 text-indigo-800 border-indigo-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200",
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



