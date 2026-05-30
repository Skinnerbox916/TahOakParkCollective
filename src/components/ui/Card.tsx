import { HTMLAttributes, ReactNode, forwardRef } from "react";
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

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, padding = "md", className, ...props },
  ref
) {
  const baseClasses = "bg-white rounded-lg shadow";
  const classes = cn(baseClasses, paddingClasses[padding], className);

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});






