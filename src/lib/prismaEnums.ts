export const ROLE = {
  USER: "USER",
  ADMIN: "ADMIN",
  ENTITY_OWNER: "ENTITY_OWNER",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const ENTITY_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type EntityStatus =
  (typeof ENTITY_STATUS)[keyof typeof ENTITY_STATUS];

export const ENTITY_TYPE = {
  COMMERCE: "COMMERCE",
  CIVIC: "CIVIC",
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

export const ApprovalType = {
  NEW_ENTITY: "NEW_ENTITY",
  UPDATE_ENTITY: "UPDATE_ENTITY",
  ADD_TAG: "ADD_TAG",
  REMOVE_TAG: "REMOVE_TAG",
  UPDATE_IMAGE: "UPDATE_IMAGE",
} as const;

export type ApprovalType =
  (typeof ApprovalType)[keyof typeof ApprovalType];

export const ApprovalStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ApprovalStatus =
  (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

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

// LocalTier for legacy Business-related code
export const LocalTier = {
  LEVEL_1_NEIGHBORS: "LEVEL_1_NEIGHBORS",
  LEVEL_2_ANCHORS: "LEVEL_2_ANCHORS",
  LEVEL_3_BOOSTERS: "LEVEL_3_BOOSTERS",
  LEVEL_4_HOMEGROWN_SUCCESS: "LEVEL_4_HOMEGROWN_SUCCESS",
} as const;

export type LocalTier = (typeof LocalTier)[keyof typeof LocalTier];
