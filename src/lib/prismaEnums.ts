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
  EVENT: "EVENT",
  SERVICE_PROVIDER: "SERVICE_PROVIDER",
} as const;

export type EntityType =
  (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

export const TagCategory = {
  IDENTITY: "IDENTITY",
  FRIENDLINESS: "FRIENDLINESS",
  AMENITY: "AMENITY",
} as const;

export type TagCategory =
  (typeof TagCategory)[keyof typeof TagCategory];

export const ChangeType = {
  CREATE_ENTITY: "CREATE_ENTITY",
  UPDATE_ENTITY: "UPDATE_ENTITY",
  ADD_TAG: "ADD_TAG",
  REMOVE_TAG: "REMOVE_TAG",
  UPDATE_IMAGE: "UPDATE_IMAGE",
} as const;

export type ChangeType =
  (typeof ChangeType)[keyof typeof ChangeType];

export const ChangeStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ChangeStatus =
  (typeof ChangeStatus)[keyof typeof ChangeStatus];

export const SuggestionStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type SuggestionStatus =
  (typeof SuggestionStatus)[keyof typeof SuggestionStatus];

export const IssueType = {
  INCORRECT_INFO: "INCORRECT_INFO",
  CLOSED: "CLOSED",
  INELIGIBLE: "INELIGIBLE",
  OTHER: "OTHER",
} as const;

export type IssueType =
  (typeof IssueType)[keyof typeof IssueType];

export const ReportStatus = {
  PENDING: "PENDING",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;

export type ReportStatus =
  (typeof ReportStatus)[keyof typeof ReportStatus];

export const MagicLinkPurpose = {
  VERIFY_SUBSCRIPTION: "VERIFY_SUBSCRIPTION",
  MANAGE_PREFERENCES: "MANAGE_PREFERENCES",
  CLAIM_ENTITY: "CLAIM_ENTITY",
} as const;

export type MagicLinkPurpose =
  (typeof MagicLinkPurpose)[keyof typeof MagicLinkPurpose];
