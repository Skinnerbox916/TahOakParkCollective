import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth, withRole } from "@/lib/api-helpers";
import { ROLE, TagCategory } from "@/lib/prismaEnums";
import { getLocaleFromRequest } from "@/lib/api-locale";
import { getTranslatedField } from "@/lib/translations";

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") as TagCategory | null;
    const search = searchParams.get("search");

    const where: any = {};

    if (category && Object.values(TagCategory).includes(category)) {
      where.category = category;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });

    // Map tags to include translated names
    const translatedTags = tags.map((tag) => ({
      ...tag,
      name: getTranslatedField(tag.nameTranslations, locale, tag.name),
    }));

    return createSuccessResponse(translatedTags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return createErrorResponse("Failed to fetch tags", 500);
  }
}

export async function POST(request: NextRequest) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const body = await request.json();
      const { name, category } = body;

      if (!name || !category) {
        return createErrorResponse("Name and category are required", 400);
      }

      if (!Object.values(TagCategory).includes(category)) {
        return createErrorResponse("Invalid category", 400);
      }

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const existing = await prisma.tag.findUnique({
        where: { slug },
      });

      if (existing) {
        return createErrorResponse("Tag already exists", 409);
      }

      const tag = await prisma.tag.create({
        data: {
          name,
          slug,
          category,
        },
      });

      return createSuccessResponse(tag, "Tag created successfully");
    } catch (error) {
      console.error("Error creating tag:", error);
      return createErrorResponse("Failed to create tag", 500);
    }
  });
}


