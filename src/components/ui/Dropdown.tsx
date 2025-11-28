"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
  contentClassName?: string;
  onOpenChange?: (open: boolean) => void;
}

export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
  contentClassName,
  onOpenChange,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleOpenChange(false);
      }
    }

    // Close menu on ESC key
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleOpenChange(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div onClick={() => handleOpenChange(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            "absolute mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50",
            align === "left" ? "left-0" : "right-0",
            contentClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}



