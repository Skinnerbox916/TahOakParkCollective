/**
 * The entity write service. Every change to an Entity, its categories or its
 * tags goes through these functions; see CLAUDE.md ("Approval workflow").
 */
export type { Actor } from "./access";
export { canManage } from "./access";
export { proposeNewEntity, proposeUpdate, deleteEntity, type ProposalSource } from "./propose";
export { approveApproval, rejectApproval, rebaseApproval, getApprovalView, type ApprovalView } from "./approvals";
export { ENTITY_FIELDS, type EntityState, type EntityChanges, type EntityField } from "./fields";
export * from "./errors";
