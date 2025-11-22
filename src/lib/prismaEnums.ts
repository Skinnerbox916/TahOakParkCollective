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

export const NEIGHBORHOOD = {
  TAHOE_PARK: "TAHOE_PARK",
  OAK_PARK: "OAK_PARK",
  ELMHURST: "ELMHURST",
  COLONIAL_PARK: "COLONIAL_PARK",
  CURTIS_PARK: "CURTIS_PARK",
} as const;

export type Neighborhood =
  (typeof NEIGHBORHOOD)[keyof typeof NEIGHBORHOOD];

