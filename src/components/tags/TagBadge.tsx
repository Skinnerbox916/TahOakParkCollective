import { TagCategory } from "@/lib/prismaEnums";

interface TagBadgeProps {
  name: string;
  category: TagCategory;
  verified?: boolean;
  className?: string;
}

export function TagBadge({ name, category, verified, className = "" }: TagBadgeProps) {
  let styles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  
  switch (category) {
    case "IDENTITY":
      styles += " bg-purple-100 text-purple-800";
      break;
    case "FRIENDLINESS":
      styles += " bg-teal-100 text-teal-800";
      break;
    case "AMENITY":
      styles += " bg-gray-100 text-gray-800";
      break;
    default:
      styles += " bg-gray-100 text-gray-800";
  }

  return (
    <span className={`${styles} ${className}`}>
      {name}
      {category === "FRIENDLINESS" && verified && (
        <svg className="ml-1 w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 9.293l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </span>
  );
}


