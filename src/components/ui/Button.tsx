import { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;
  target?: string;
  rel?: string;
  children: ReactNode;
}

const variantClasses = {
  primary: "bg-primary-600 text-white hover:bg-primary-700",
  secondary: "bg-gray-600 text-white hover:bg-gray-700",
  danger: "bg-error-600 text-white hover:bg-error-700",
  outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  href,
  target,
  rel,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = "inline-block font-medium rounded-lg transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed";
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (href) {
    return (
      <Link href={href} className={classes} target={target} rel={rel}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}






