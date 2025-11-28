import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "sm" | "md" | "lg" | "none";
}

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  none: "",
};

export function Card({
  children,
  padding = "md",
  className,
  ...props
}: CardProps) {
  const baseClasses = "bg-white rounded-lg shadow";
  const classes = cn(baseClasses, paddingClasses[padding], className);

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}






