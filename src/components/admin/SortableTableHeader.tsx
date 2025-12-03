"use client";

import { cn } from "@/lib/utils";
import { SortIcon } from "@/components/ui/SortIcon";

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSortBy?: string;
  currentSortOrder?: "asc" | "desc";
  onSort: (sortKey: string) => void;
  className?: string;
}

/**
 * SortableTableHeader - Reusable sortable table header component
 * 
 * Follows UI conventions:
 * - Uses cn() utility for className merging
 * - Accepts className prop for overrides
 * - Proper accessibility with ARIA attributes
 * - Focus states using focus-ring utility class
 * - Keyboard support (Enter/Space)
 */
export function SortableTableHeader({
  label,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className,
}: SortableTableHeaderProps) {
  const isSorted = currentSortBy === sortKey;
  const sortDirection = isSorted ? currentSortOrder : null;
  
  // Determine aria-sort value
  const ariaSort = isSorted
    ? currentSortOrder === "asc"
      ? "ascending"
      : "descending"
    : "none";

  const handleClick = () => {
    onSort(sortKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSort(sortKey);
    }
  };

  return (
    <th
      className={cn(
        "px-3 lg:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
        className
      )}
      aria-sort={ariaSort}
    >
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center gap-1 hover:text-gray-700 transition-colors",
          "cursor-pointer select-none w-full text-left",
          "focus:outline-none focus:underline focus:decoration-2",
          isSorted && "text-gray-900"
        )}
        aria-label={`Sort by ${label} ${
          isSorted
            ? currentSortOrder === "asc"
              ? "descending"
              : "ascending"
            : "ascending"
        }`}
      >
        <span>{label}</span>
        <SortIcon
          direction={sortDirection}
          className={cn(
            "transition-opacity",
            isSorted ? "opacity-100" : "opacity-40 group-hover:opacity-60"
          )}
        />
      </button>
    </th>
  );
}

