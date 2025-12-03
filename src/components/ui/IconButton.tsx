import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline";
  "aria-label": string;
}

const sizeClasses = {
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
};

const variantClasses = {
  ghost: "hover:bg-gray-100",
  outline: "border border-gray-300 hover:bg-gray-50",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = "md", variant = "ghost", className, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
    const classes = cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      className
    );

    return (
      <button ref={ref} className={classes} {...props}>
        {icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

