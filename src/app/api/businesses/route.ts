import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuccessResponse, createErrorResponse, withAuth } from "@/lib/api-helpers";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";
import type { BusinessStatus } from "@/lib/prismaEnums";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as BusinessStatus | null;
    const categoryId = searchParams.get("categoryId");
    const category = searchParams.get("category"); // Also support "category" param
    const neighborhood = searchParams.get("neighborhood");
    const searchQuery = searchParams.get("q") || searchParams.get("search");

    const where: any = {};
    
    if (status) {
      where.status = status;
    } else {
      // Default to only active businesses for public
      where.status = BUSINESS_STATUS.ACTIVE;
    }

    // Use categoryId or category param
    const finalCategoryId = categoryId || category;
    if (finalCategoryId) {
      where.categoryId = finalCategoryId;
    }

    if (neighborhood) {
      where.neighborhoods = {
        has: neighborhood,
      };
    }

    // Keyword search across name and description
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim();
      where.OR = [
        {
          name: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    const businesses = await prisma.business.findMany({
      where,
      include: {
        category: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return createSuccessResponse(businesses);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return createErrorResponse("Failed to fetch businesses", 500);
  }
}

export async function POST(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const { name, description, address, phone, website, categoryId, neighborhoods } = body;

      if (!name) {
        return createErrorResponse("Business name is required", 400);
      }

      // Generate slug from name
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Ensure unique slug
      const existingBusiness = await prisma.business.findUnique({
        where: { slug },
      });

      let uniqueSlug = slug;
      let counter = 1;
      while (existingBusiness) {
        uniqueSlug = `${slug}-${counter}`;
        const check = await prisma.business.findUnique({
          where: { slug: uniqueSlug },
        });
        if (!check) break;
        counter++;
      }

      const business = await prisma.business.create({
        data: {
          name,
          slug: uniqueSlug,
          description,
          address,
          phone,
          website,
          categoryId: categoryId || null,
          neighborhoods: neighborhoods || [],
          status: BUSINESS_STATUS.PENDING,
          ownerId: user.id,
        },
        include: {
          category: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return createSuccessResponse(business, "Business created successfully");
    } catch (error) {
      console.error("Error creating business:", error);
      return createErrorResponse("Failed to create business", 500);
    }
  });
}

