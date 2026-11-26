import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, entityErrorResponse, withAuth } from "@/lib/api-helpers";
import { ENTITY_STATUS, ROLE } from "@/lib/prismaEnums";
import type { EntityType } from "@/lib/prismaEnums";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { entityIncludePublic, entityIncludeWithMembers, transformEntity, buildEntityWhereClause } from "@/lib/entity-helpers";
import { proposeNewEntity } from "@/lib/entities";
import { notifyAdmins } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const category = searchParams.get("category"); 
    const entityType = searchParams.get("entityType") as EntityType | null;
    const searchQuery = searchParams.get("q") || searchParams.get("search");
    const featured = searchParams.get("featured") === "true";
    const sort = searchParams.get("sort") || "random"; // Default to random

    // Build where clause using helper
    // Public endpoint: always ACTIVE only. Admins list other statuses via
    // /api/admin/entities.
    const where = await buildEntityWhereClause({
      status: ENTITY_STATUS.ACTIVE,
      categoryId: categoryId || null,
      category: category || null,
      entityType,
      featured,
      searchQuery: searchQuery || null,
    });

    // Sorting
    let orderBy: any = { createdAt: "desc" }; // Default fallback
    if (sort === "name") {
      orderBy = { name: "asc" };
    } else if (sort === "featured") {
      orderBy = [{ featured: "desc" }, { name: "asc" }];
    }
    // If sort === 'random', we'll handle it in memory after fetch

    const entities = await prisma.entity.findMany({
      where,
      include: entityIncludePublic,
      orderBy: sort !== "random" ? orderBy : undefined,
    });

    // Handle random sort in memory
    if (sort === "random") {
      for (let i = entities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [entities[i], entities[j]] = [entities[j], entities[i]];
      }
    }

    // Map entities to include translated content
    const translatedEntities = entities.map((entity) => transformEntity(entity, locale));

    return createSuccessResponse(translatedEntities);
  } catch (error: any) {
    console.error("Error fetching entities:", error);
    return createErrorResponse("Failed to fetch entities", 500);
  }
}

/**
 * Create a listing. Admins create it directly; anyone else submits it for
 * review (it's created, owned by them, when an admin approves). Categories
 * and tags are slugs (categorySlugs, tagSlugs), as the write service takes them.
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const isAdmin = user.roles.includes(ROLE.ADMIN);


      // Admins may name an initial owner; otherwise an admin-created listing
      // starts unclaimed. Owners' own submissions make them the owner on approval.
      let initialOwnerId: string | undefined;
      if (isAdmin && typeof body.ownerId === "string" && body.ownerId) {
        const owner = await prisma.user.findUnique({ where: { id: body.ownerId }, select: { id: true } });
        if (!owner) return createErrorResponse("Specified owner not found", 400);
        initialOwnerId = owner.id;
      }

      const result = await proposeNewEntity(user, body, { source: isAdmin ? "admin" : "owner", initialOwnerId });

      if (result.pending) {
        await notifyAdmins(
          `New listing to review: ${String(body.name ?? "").slice(0, 120)}`,
          [`${user.email ?? "A signed-in user"} submitted their own listing. Approving it makes them its owner; they publish it from their dashboard.`],
          `/admin/approvals/${result.approval.id}`
        );
        return createSuccessResponse(
          { approval: { id: result.approval.id, status: result.approval.status }, pendingReview: true },
          "Submitted for review"
        );
      }

      const entity = await prisma.entity.findUnique({
        where: { id: result.entityId },
        include: entityIncludeWithMembers,
      });
      return createSuccessResponse(entity, "Entity created successfully");
    } catch (error) {
      return entityErrorResponse(error, "Failed to create entity");
    }
  });
}
