import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse, entityErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE, MemberRole } from "@/lib/prismaEnums";
import { addMember, listMembers, removeMember } from "@/lib/entities";

type Params = { params: Promise<{ id: string }> };

// GET - who manages this listing
export async function GET(request: NextRequest, { params }: Params) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const { id } = await params;
      return createSuccessResponse(await listMembers(id));
    } catch (error) {
      return entityErrorResponse(error, "Failed to load members");
    }
  });
}

// POST { email, role } - add someone (they need an account)
export async function POST(request: NextRequest, { params }: Params) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const { email, role } = await request.json();
      if (typeof email !== "string" || !email.trim()) return createErrorResponse("Email is required", 400);
      const memberRole = role === MemberRole.MANAGER ? MemberRole.MANAGER : MemberRole.OWNER;
      await addMember(user, id, email, memberRole);
      return createSuccessResponse(await listMembers(id), "Member added");
    } catch (error) {
      return entityErrorResponse(error, "Failed to add member");
    }
  });
}

// DELETE ?userId= - remove someone
export async function DELETE(request: NextRequest, { params }: Params) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const userId = request.nextUrl.searchParams.get("userId");
      if (!userId) return createErrorResponse("userId is required", 400);
      await removeMember(user, id, userId);
      return createSuccessResponse(await listMembers(id), "Member removed");
    } catch (error) {
      return entityErrorResponse(error, "Failed to remove member");
    }
  });
}
