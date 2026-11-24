/**
 * The entity write service. Every change to an Entity, its categories or its
 * tags goes through these functions; see CLAUDE.md ("Approval workflow").
 */
export type { Actor } from "./access";
export { canManage, managesAnyEntity, memberRole } from "./access";
export { listMembers, addMember, removeMember } from "./members";
export { proposeNewEntity, proposeUpdate, deleteEntity, type ProposalSource } from "./propose";
export { approveApproval, rejectApproval, rebaseApproval, getApprovalView, type ApprovalView } from "./approvals";
export { publishListing, unpublishListing, TermsChangedError } from "./consent";
export {
  createShareLink,
  listShareLinks,
  revokeShareLink,
  lookupShareLink,
  acceptShareLink,
  shareLinkUrl,
  type ShareLinkState,
} from "./share-links";
export { CONSENT_EXEMPT_TYPES, LISTING_TERMS_VERSION, requiresConsent } from "./policy";
export { ENTITY_FIELDS, type EntityState, type EntityChanges, type EntityField } from "./fields";
export * from "./errors";
