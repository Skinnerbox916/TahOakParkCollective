import type { EntityType } from "@/lib/prismaEnums";

export const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "COMMERCE", label: "Commerce" },
  { value: "CIVIC", label: "Civic" },
  { value: "ADVOCACY", label: "Advocacy" },
  { value: "PUBLIC_SPACE", label: "Public Space" },
  { value: "NON_PROFIT", label: "Non-Profit" },
  { value: "EVENT", label: "Event" },
  { value: "SERVICE_PROVIDER", label: "Service Provider" },
];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  COMMERCE: "Commerce",
  CIVIC: "Civic",
  ADVOCACY: "Advocacy",
  PUBLIC_SPACE: "Public Space",
  NON_PROFIT: "Non-Profit",
  EVENT: "Event",
  SERVICE_PROVIDER: "Service Provider",
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

