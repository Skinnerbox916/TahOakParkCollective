import type { Neighborhood } from "@/lib/prismaEnums";

export const NEIGHBORHOODS: { value: Neighborhood; label: string }[] = [
  { value: "TAHOE_PARK", label: "Tahoe Park" },
  { value: "OAK_PARK", label: "Oak Park" },
  { value: "ELMHURST", label: "Elmhurst" },
  { value: "COLONIAL_PARK", label: "Colonial Park" },
  { value: "CURTIS_PARK", label: "Curtis Park" },
];

export const NEIGHBORHOOD_LABELS: Record<Neighborhood, string> = {
  TAHOE_PARK: "Tahoe Park",
  OAK_PARK: "Oak Park",
  ELMHURST: "Elmhurst",
  COLONIAL_PARK: "Colonial Park",
  CURTIS_PARK: "Curtis Park",
};

export const DEFAULT_CATEGORIES = [
  { name: "Restaurants", slug: "restaurants", description: "Dining establishments" },
  { name: "Retail", slug: "retail", description: "Retail shops and stores" },
  { name: "Services", slug: "services", description: "Professional and personal services" },
  { name: "Entertainment", slug: "entertainment", description: "Entertainment venues" },
  { name: "Healthcare", slug: "healthcare", description: "Healthcare providers" },
  { name: "Education", slug: "education", description: "Educational institutions" },
  { name: "Automotive", slug: "automotive", description: "Auto services and dealerships" },
  { name: "Home & Garden", slug: "home-garden", description: "Home improvement and garden centers" },
];

