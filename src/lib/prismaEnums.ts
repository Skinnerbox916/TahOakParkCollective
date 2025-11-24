export const ROLE = {
  USER: "USER",
  ADMIN: "ADMIN",
  BUSINESS_OWNER: "BUSINESS_OWNER",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const BUSINESS_STATUS = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  INACTIVE: "INACTIVE",
} as const;

export type BusinessStatus =
  (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS];

export const ENTITY_TYPE = {
  COMMERCE: "COMMERCE",
  CIVIC: "CIVIC",
  ADVOCACY: "ADVOCACY",
  PUBLIC_SPACE: "PUBLIC_SPACE",
  NON_PROFIT: "NON_PROFIT",
} as const;

export type EntityType =
  (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

