import type { EntityType } from "@/lib/prismaEnums";

export interface SearchParams {
  q?: string;
  category?: string;
  entityType?: EntityType | "";
  view?: "map" | "list";
}

export function buildSearchUrl(params: SearchParams): string {
  const searchParams = new URLSearchParams();

  if (params.q && params.q.trim()) {
    searchParams.set("q", params.q.trim());
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.entityType) {
    searchParams.set("entityType", params.entityType);
  }

  if (params.view) {
    searchParams.set("view", params.view);
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export function parseSearchParams(
  searchParams: URLSearchParams
): SearchParams {
  return {
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || "",
    entityType: (searchParams.get("entityType") as EntityType) || "",
    view: (searchParams.get("view") as "map" | "list") || "list",
  };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

