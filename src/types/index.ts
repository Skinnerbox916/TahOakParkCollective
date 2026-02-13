import type { Entity, Category, User, Prisma, Tag, EntityTag, Approval } from "@prisma/client";
import type { Role, EntityStatus, EntityType, TagCategory, ApprovalType, ApprovalStatus } from "@/lib/prismaEnums";

export type { Entity, Category, User, Role, EntityStatus, EntityType, Tag, EntityTag, TagCategory, Approval, ApprovalType, ApprovalStatus };

export type EntityTagWithTag = EntityTag & { tag: Tag };

export type ApprovalWithEntity = Approval & {
  entity?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  targetEntity?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  proposedEntityData?: Record<string, unknown>;
};

type EntityLocalizedFields = {
  nameLocalized?: string | null;
  descriptionLocalized?: string | null;
  categories?: Array<
    Prisma.EntityGetPayload<{ include: { categories: true } }>["categories"][number] & {
      nameLocalized?: string | null;
      descriptionLocalized?: string | null;
    }
  >;
  tags?: Array<
    EntityTagWithTag & {
      tag: EntityTagWithTag["tag"] & {
        nameLocalized?: string | null;
      };
    }
  >;
  // Legacy single-category support
  category?: {
    id?: string;
    name?: string | null;
    description?: string | null;
    nameLocalized?: string | null;
    descriptionLocalized?: string | null;
  };
};

export type EntityWithRelations = Prisma.EntityGetPayload<{
  include: {
    categories: true;
    owner: true;
    tags: {
      include: {
        tag: true;
      };
    };
  };
}> &
  EntityLocalizedFields;

// Backward-compatible alias if callers want an explicit name
export type EntityWithLocalized = EntityWithRelations;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}

export interface SocialMediaLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  yelp?: string;
  tiktok?: string;
  youtube?: string;
  threads?: string;
}

export interface EntityFormData {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  categoryIds?: string[];
  entityType?: EntityType;
  hours?: BusinessHours;
  socialMedia?: SocialMediaLinks;
}
