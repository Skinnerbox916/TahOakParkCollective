// Keyword expansion utility for semantic search
// Maps common search terms to category slugs and related keywords

interface CategorySynonyms {
  [categorySlug: string]: string[];
}

// Map common search terms to category slugs
const CATEGORY_SYNONYMS: CategorySynonyms = {
  restaurants: [
    "food", "restaurant", "dining", "cafe", "eatery", "bistro",
    "diner", "grill", "pizza", "burger", "sushi", "italian",
    "mexican", "chinese", "breakfast", "lunch", "dinner", "eat",
    "place to eat", "where to eat", "food place"
  ],
  retail: [
    "shop", "store", "retail", "buy", "shopping", "market",
    "boutique", "gift", "merchandise", "shopping", "store"
  ],
  services: [
    "service", "professional", "consulting", "help", "support",
    "repair", "maintenance", "cleaning", "legal", "accounting"
  ],
  entertainment: [
    "entertainment", "fun", "activity", "event", "venue",
    "theater", "music", "nightlife", "bar", "club"
  ],
  healthcare: [
    "health", "medical", "doctor", "clinic", "hospital",
    "dentist", "therapy", "wellness", "care"
  ],
  education: [
    "school", "education", "learn", "training", "class",
    "tutoring", "academic", "student"
  ],
  automotive: [
    "car", "auto", "vehicle", "automotive", "mechanic",
    "repair", "dealership", "tire", "oil"
  ],
  "home-garden": [
    "home", "garden", "hardware", "improvement", "furniture",
    "decor", "landscaping", "tools"
  ],
};

/**
 * Expand a search query with semantic synonyms
 * Returns an array of expanded search terms
 */
export function expandSearchQuery(query: string): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  const expandedTerms: Set<string> = new Set([normalizedQuery]);
  
  // Check category synonyms
  for (const [categorySlug, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    if (synonyms.some(syn => 
      normalizedQuery === syn || 
      normalizedQuery.includes(syn) || 
      syn.includes(normalizedQuery)
    )) {
      // Add the category name itself
      expandedTerms.add(categorySlug);
      // Add related synonyms
      synonyms.forEach(syn => expandedTerms.add(syn));
    }
  }
  
  return Array.from(expandedTerms);
}

/**
 * Get category slugs that match a search query
 * Returns an array of category slugs that should be included in search
 */
export function getMatchingCategories(query: string): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  const matchingCategories: string[] = [];
  
  for (const [categorySlug, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    if (synonyms.some(syn => 
      normalizedQuery === syn || 
      normalizedQuery.includes(syn) || 
      syn.includes(normalizedQuery)
    )) {
      matchingCategories.push(categorySlug);
    }
  }
  
  return matchingCategories;
}


