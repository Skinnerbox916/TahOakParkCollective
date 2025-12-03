"use client";

import { useState, useId, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  /** Section title */
  title: string;
  /** Optional description/hint text below title */
  description?: string;
  /** Whether the section starts expanded (uncontrolled mode) */
  defaultExpanded?: boolean;
  /** Controlled expanded state - when provided, component is controlled */
  expanded?: boolean;
  /** Callback when expanded state changes (for controlled mode) */
  onExpandedChange?: (expanded: boolean) => void;
  /** Whether any field in this section has data (shows filled indicator) */
  hasData?: boolean;
  /** Children to render inside the section */
  children: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether the section is collapsible (default: true) */
  collapsible?: boolean;
}

/**
 * FormSection - A collapsible form section with completion indicator.
 * 
 * Used in CRM-style forms to organize fields into logical groups
 * that can be expanded/collapsed.
 * 
 * Features:
 * - Expand/collapse toggle with chevron icon
 * - Completion indicator (● when hasData, ○ when empty)
 * - Smooth expand/collapse animation
 * - Keyboard accessible (Enter/Space to toggle)
 */
export function FormSection({
  title,
  description,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandedChange,
  hasData = false,
  children,
  className,
  collapsible = true,
}: FormSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const contentId = useId();
  const headerId = useId();

  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (!collapsible) return;
    const newValue = !isExpanded;
    if (onExpandedChange) {
      onExpandedChange(newValue);
    }
    if (controlledExpanded === undefined) {
      setInternalExpanded(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (collapsible && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className={cn(
        "border border-gray-200 rounded-lg bg-white overflow-hidden",
        className
      )}
    >
      {/* Section Header */}
      <div
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? isExpanded : undefined}
        aria-controls={collapsible ? contentId : undefined}
        id={headerId}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center justify-between px-4 py-3",
          collapsible && "cursor-pointer hover:bg-gray-50 transition-colors",
          !collapsible && "bg-gray-50"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Chevron */}
          {collapsible && (
            <svg
              className={cn(
                "w-5 h-5 text-gray-400 transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
          
          {/* Title and Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            {description && !isExpanded && collapsible && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {/* Completion Indicator */}
        <div className="flex items-center">
          {hasData ? (
            <span
              className="w-2.5 h-2.5 rounded-full bg-green-500"
              aria-label="Section has data"
              title="Has data"
            />
          ) : (
            <span
              className="w-2.5 h-2.5 rounded-full border-2 border-gray-300"
              aria-label="Section is empty"
              title="Empty"
            />
          )}
        </div>
      </div>

      {/* Section Content */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isExpanded || !collapsible
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          {description && (isExpanded || !collapsible) && (
            <p className="text-sm text-gray-500 mb-4">{description}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
