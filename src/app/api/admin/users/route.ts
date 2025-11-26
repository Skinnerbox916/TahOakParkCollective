import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import type { Role } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const roleFilter = searchParams.get("role") as Role | null;
      const search = searchParams.get("search") || "";

      // Fetch all users (we'll filter by role and search in JavaScript)
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          _count: {
            select: {
              entities: true,
            },
          },
        },
        // Note: User model doesn't have createdAt field, so we can't order by it
        // Order by id instead (which is a cuid, so roughly chronological)
      });

      // Transform to include business count and filter by role/search if provided
      let usersWithCounts = users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        businessCount: user._count.entities,
      }));

      // Filter by role if provided
      if (roleFilter) {
        usersWithCounts = usersWithCounts.filter((user) =>
          user.roles.includes(roleFilter)
        );
      }

      // Filter by search term in JavaScript (handles nullable fields safely)
      if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        usersWithCounts = usersWithCounts.filter((user) => {
          const nameMatch = user.name?.toLowerCase().includes(searchTerm);
          const emailMatch = user.email?.toLowerCase().includes(searchTerm);
          return nameMatch || emailMatch;
        });
      }

      return createSuccessResponse(usersWithCounts);
    } catch (error) {
      console.error("Error fetching users:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return createErrorResponse(`Failed to fetch users: ${errorMessage}`, 500);
    }
  });
}

