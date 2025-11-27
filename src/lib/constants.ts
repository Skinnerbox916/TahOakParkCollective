import type { EntityType, LocalTier } from "@/lib/prismaEnums";

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

// NOTE: Categories are managed in the database, not hardcoded here.
// See prisma/seed.ts for the canonical category list.
// Use the /api/categories endpoint to fetch categories.

// Local Tier constants (legacy Business terminology)
export const LOCAL_TIERS: { value: LocalTier; label: string }[] = [
  { value: "LEVEL_1_NEIGHBORS", label: "Level 1 - Neighbors" },
  { value: "LEVEL_2_ANCHORS", label: "Level 2 - Anchors" },
  { value: "LEVEL_3_BOOSTERS", label: "Level 3 - Boosters" },
  { value: "LEVEL_4_HOMEGROWN_SUCCESS", label: "Level 4 - Homegrown Success" },
];

export const LOCAL_TIER_LABELS: Record<LocalTier, string> = {
  LEVEL_1_NEIGHBORS: "Neighbors",
  LEVEL_2_ANCHORS: "Anchors",
  LEVEL_3_BOOSTERS: "Boosters",
  LEVEL_4_HOMEGROWN_SUCCESS: "Homegrown Success",
};

