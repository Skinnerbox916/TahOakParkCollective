import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import { auth } from "@/lib/better-auth";
import { hasAdminRole } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/** PUT { roles } - make someone an admin or not. Never removes the last admin. */
export async function PUT(request: NextRequest, { params }: Params) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const { id } = await params;
      const { roles } = await request.json();
      if (!Array.isArray(roles)) return createErrorResponse("roles must be an array", 400);
      const makeAdmin = roles.includes(ROLE.ADMIN);

      const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
      if (!target) return createErrorResponse("User not found", 404);

      if (hasAdminRole(target.role) && !makeAdmin) {
        const admins = await prisma.user.count({ where: { role: { contains: "admin" } } });
        if (admins <= 1) {
          return createErrorResponse("Cannot remove the last admin. Promote another user first.", 400);
        }
      }

      await auth.api.setRole({ body: { userId: id, role: makeAdmin ? "admin" : "user" }, headers: await headers() });
      return createSuccessResponse(
        { id, roles: makeAdmin ? [ROLE.USER, ROLE.ADMIN] : [ROLE.USER] },
        "User roles updated successfully"
      );
    } catch (error) {
      console.error("Error updating user roles:", error);
      return createErrorResponse("Failed to update user roles", 500);
    }
  });
}

/** POST { action: "ban" | "unban" | "revokeSessions" } */
export async function POST(request: NextRequest, { params }: Params) {
  return withRole([ROLE.ADMIN], async (admin) => {
    try {
      const { id } = await params;
      const { action, reason } = await request.json();
      if (id === admin.id && action !== "revokeSessions") {
        return createErrorResponse("You can't ban yourself", 400);
      }
      const h = await headers();

      if (action === "ban") {
        // Banning also signs them out everywhere
        await auth.api.banUser({ body: { userId: id, banReason: typeof reason === "string" ? reason : undefined }, headers: h });
      } else if (action === "unban") {
        await auth.api.unbanUser({ body: { userId: id }, headers: h });
      } else if (action === "revokeSessions") {
        await auth.api.revokeUserSessions({ body: { userId: id }, headers: h });
      } else {
        return createErrorResponse("Unknown action", 400);
      }
      return createSuccessResponse({ id, action }, "Done");
    } catch (error) {
      console.error("Error updating user:", error);
      return createErrorResponse("Failed to update user", 500);
    }
  });
}
