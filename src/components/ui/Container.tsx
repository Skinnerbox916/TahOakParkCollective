import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  as?: keyof JSX.IntrinsicElements;
}

const sizeClasses = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  full: "max-w-full",
};

const paddingClasses = {
  none: "",
  sm: "px-4 py-4",
  md: "px-4 sm:px-6 lg:px-8 py-8",
  lg: "px-4 sm:px-6 lg:px-8 py-12",
};

export function Container({
  children,
  size = "lg",
  padding = "md",
  as: Component = "div",
  className,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        size !== "full" && sizeClasses[size],
        "mx-auto",
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}



