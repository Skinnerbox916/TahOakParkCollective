"use client";

import { ReactNode, useState } from "react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

interface AlertProps {
  variant: "error" | "warning" | "success" | "info";
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const variantClasses = {
  error: "bg-error-50 border-error-200 text-error-700",
  warning: "bg-warning-50 border-warning-200 text-warning-700",
  success: "bg-success-50 border-success-200 text-success-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
};

export function Alert({
  variant,
  children,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <Card
      className={cn(
        "mb-6 border",
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">{children}</div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-4 text-current opacity-50 hover:opacity-100 focus-ring rounded"
            aria-label="Dismiss alert"
          >
            ×
          </button>
        )}
      </div>
    </Card>
  );
}



