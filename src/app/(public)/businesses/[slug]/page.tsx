import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BUSINESS_STATUS } from "@/lib/prismaEnums";
import { BusinessDetail } from "@/components/business/BusinessDetail";
import type { BusinessWithRelations } from "@/types";

async function getBusinessBySlug(slug: string): Promise<BusinessWithRelations | null> {
  try {
    const business = await prisma.entity.findFirst({
      where: {
        slug,
        status: BUSINESS_STATUS.ACTIVE, // Only show active businesses publicly
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

    return business as BusinessWithRelations | null;
  } catch (error) {
    console.error("Error fetching business:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return {
      title: "Business Not Found",
    };
  }

  return {
    title: `${business.name} | TahOak Park Collective`,
    description:
      business.description ||
      `Visit ${business.name}`,
  };
}

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  return <BusinessDetail business={business} />;
}

