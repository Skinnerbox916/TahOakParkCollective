import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, entityErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import { approveApproval, getApprovalView, listMembers, rebaseApproval, rejectApproval } from "@/lib/entities";

async function loadApprovalWithView(id: string) {
  const approval = await prisma.approval.findUnique({
    where: { id },
    include: {
      targetEntity: { select: { id: true, name: true, slug: true, status: true, version: true } },
      entity: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!approval) return null;

  const view = await getApprovalView(approval);
  const state = view.proposedState as { categorySlugs?: string[]; tagSlugs?: string[] };
  const [resolvedCategories, resolvedTags] = await Promise.all([
    state.categorySlugs?.length
      ? prisma.category.findMany({
          where: { slug: { in: state.categorySlugs } },
          select: { id: true, name: true, slug: true },
        })
      : [],
    state.tagSlugs?.length
      ? prisma.tag.findMany({
          where: { slug: { in: state.tagSlugs } },
          select: { id: true, name: true, slug: true, category: true },
        })
      : [],
  ]);

  // Claims: who is asking, what they said, and who manages the listing now
  let claim = null;
  if (approval.type === "CLAIM_ENTITY") {
    const [claimant, members] = await Promise.all([
      approval.submittedBy
        ? prisma.user.findUnique({ where: { id: approval.submittedBy }, select: { id: true, name: true, email: true } })
        : null,
      approval.targetEntityId ? listMembers(approval.targetEntityId) : [],
    ]);
    claim = {
      claimant,
      message: (approval.payload as { message?: string | null } | null)?.message ?? null,
      members: members.map((m) => ({ role: m.role, user: m.user })),
    };
  }

  return { ...approval, ...view, claim, resolvedCategories, resolvedTags };
}

// GET - the approval, what it would change, and any conflicts with the live entity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const { id } = await params;
      const result = await loadApprovalWithView(id);
      if (!result) return createErrorResponse("Approval not found", 404);
      return createSuccessResponse(result);
    } catch (error) {
      return entityErrorResponse(error, "Failed to fetch approval");
    }
  });
}

// PUT - approve or reject. A conflicting update returns 409 (code "conflict").
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const { action, notes } = await request.json();

      if (action === "REJECT") {
        await rejectApproval(user, id, notes);
        return createSuccessResponse({ approvalId: id }, "Approval rejected");
      }
      if (action === "APPROVE") {
        const result = await approveApproval(user, id, notes);
        return createSuccessResponse(result, "Approved");
      }
      return createErrorResponse("Valid action (APPROVE or REJECT) is required", 400);
    } catch (error) {
      return entityErrorResponse(error, "Failed to process approval");
    }
  });
}

// PATCH - edit a pending proposal. For updates this rebases it onto the
// entity as it is now, which is how conflicts get resolved.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const fields = body.fields ?? body.proposedEntityData;
      if (!fields || typeof fields !== "object") {
        return createErrorResponse("fields is required and must be an object", 400);
      }

      await rebaseApproval(user, id, fields);
      const result = await loadApprovalWithView(id);
      return createSuccessResponse(result, "Approval updated");
    } catch (error) {
      return entityErrorResponse(error, "Failed to update approval");
    }
  });
}
