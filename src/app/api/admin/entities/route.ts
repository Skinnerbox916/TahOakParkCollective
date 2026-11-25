import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, entityErrorResponse, withRole } from "@/lib/api-helpers";
import { proposeUpdate } from "@/lib/entities";
import { ROLE } from "@/lib/prismaEnums";
import type { EntityStatus, EntityType } from "@/lib/prismaEnums";
import { entityIncludeWithMembers, buildAdminEntitySearchWhere } from "@/lib/entity-helpers";

export async function GET(request: NextRequest) {
  return withRole([ROLE.ADMIN], async () => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get("status") as EntityStatus | null;
      const search = searchParams.get("search") || "";
      const categoryId = searchParams.get("categoryId") || "";
      const entityType = searchParams.get("entityType") as EntityType | null;
      const sortBy = searchParams.get("sortBy") || "createdAt";
      const sortOrder = searchParams.get("sortOrder") || "desc";

      // Validate sortBy parameter
      const allowedSortFields = ["name", "entityType", "status", "createdAt", "owner"];
      if (!allowedSortFields.includes(sortBy)) {
        return createErrorResponse("Invalid sortBy parameter", 400);
      }

      // Validate sortOrder parameter
      if (sortOrder !== "asc" && sortOrder !== "desc") {
        return createErrorResponse("Invalid sortOrder parameter", 400);
      }

      const where: any = {};
      
      if (status) {
        where.status = status;
      }

      if (categoryId) {
        where.categories = { some: { id: categoryId } };
      }

      if (entityType) {
        where.entityType = entityType;
      }

      if (search) {
        const searchConditions = await buildAdminEntitySearchWhere(search);
        where.OR = searchConditions;
      }

      // Build dynamic orderBy based on sortBy parameter
      let orderBy: any;
      if (sortBy === "owner") {
        // Unclaimed listings first (asc) or last (desc)
        orderBy = { members: { _count: sortOrder } };
      } else {
        // Sort by direct field
        orderBy = {
          [sortBy]: sortOrder,
        };
      }

      const entities = await prisma.entity.findMany({
        where,
        include: entityIncludeWithMembers,
        orderBy,
      });

      return createSuccessResponse(entities);
    } catch (error) {
      console.error("Error fetching entities:", error);
      return createErrorResponse("Failed to fetch entities", 500);
    }
  });
}

export async function PUT(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { id, status, featured, entityType } = body;

      if (!id) {
        return createErrorResponse("Entity ID is required", 400);
      }

      const fields: Record<string, unknown> = {};
      if (status !== undefined) fields.status = status;
      if (featured !== undefined) fields.featured = Boolean(featured);
      if (entityType !== undefined) fields.entityType = entityType;

      if (Object.keys(fields).length === 0) {
        return createErrorResponse("At least one field (status, featured, or entityType) must be provided", 400);
      }

      await proposeUpdate(user, id, fields, { source: "admin" });
      const entity = await prisma.entity.findUnique({ where: { id }, include: entityIncludeWithMembers });

      return createSuccessResponse(entity, "Entity updated successfully");
    } catch (error) {
      return entityErrorResponse(error, "Failed to update entity");
    }
  });
}

