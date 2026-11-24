import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import type { Role } from "@/lib/prismaEnums";
import { hasAdminRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const roleFilter = searchParams.get("role") as Role | null;
      const search = (searchParams.get("search") || "").trim().toLowerCase();

      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          banned: true,
          twoFactorEnabled: true,
          createdAt: true,
          _count: { select: { memberships: true, passkeys: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      const rows = users
        .map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          roles: hasAdminRole(user.role) ? [ROLE.USER, ROLE.ADMIN] : [ROLE.USER],
          businessCount: user._count.memberships,
          emailVerified: user.emailVerified,
          banned: user.banned ?? false,
          passkeys: user._count.passkeys,
          twoFactorEnabled: user.twoFactorEnabled ?? false,
        }))
        .filter((user) => !roleFilter || user.roles.includes(roleFilter))
        .filter((user) => !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search));

      return createSuccessResponse(rows);
    } catch (error) {
      console.error("Error fetching users:", error);
      return createErrorResponse("Failed to fetch users", 500);
    }
  });
}
