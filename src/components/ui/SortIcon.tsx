import { cn } from "@/lib/utils";

interface SortIconProps {
  direction?: "asc" | "desc" | null;
  className?: string;
}

/**
 * SortIcon - Reusable icon component for sort indicators
 * 
 * @param direction - "asc" shows up arrow, "desc" shows down arrow, null shows both/unsorted
 * @param className - Optional className for styling overrides
 */
export function SortIcon({ direction = null, className }: SortIconProps) {
  return (
    <svg
      className={cn("w-4 h-4 ml-1 inline-block", className)}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      {direction === "asc" ? (
        // Up arrow for ascending
        <path d="M8 3l4 5H4l4-5z" />
      ) : direction === "desc" ? (
        // Down arrow for descending
        <path d="M8 13l-4-5h8l-4 5z" />
      ) : (
        // Both arrows for unsorted
        <>
          <path d="M8 3l3 4H5l3-4z" opacity="0.3" />
          <path d="M8 13l-3-4h6l-3 4z" opacity="0.3" />
        </>
      )}
    </svg>
  );
}

