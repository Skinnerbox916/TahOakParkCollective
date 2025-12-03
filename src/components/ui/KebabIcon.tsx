import { cn } from "@/lib/utils";

interface KebabIconProps {
  className?: string;
}

export function KebabIcon({ className }: KebabIconProps) {
  return (
    <svg
      className={cn("text-gray-600", className)}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
  );
}

