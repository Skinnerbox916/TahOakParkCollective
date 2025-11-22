import type { Neighborhood } from "@/lib/prismaEnums";

export interface SearchParams {
  q?: string;
  neighborhood?: Neighborhood | "";
  category?: string;
  view?: "map" | "list";
}

export function buildSearchUrl(params: SearchParams): string {
  const searchParams = new URLSearchParams();

  if (params.q && params.q.trim()) {
    searchParams.set("q", params.q.trim());
  }

  if (params.neighborhood) {
    searchParams.set("neighborhood", params.neighborhood);
  }

  if (params.category) {
    searchParams.set("category", params.category);
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
    neighborhood: (searchParams.get("neighborhood") as Neighborhood) || "",
    category: searchParams.get("category") || "",
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

