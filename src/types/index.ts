import type { Entity, Category, User, Prisma, Tag, EntityTag, PendingChange } from "@prisma/client";
import type { Role, EntityStatus, EntityType, TagCategory, ChangeType, ChangeStatus } from "@/lib/prismaEnums";

export type { Entity, Category, User, Role, EntityStatus, EntityType, Tag, EntityTag, TagCategory, PendingChange, ChangeType, ChangeStatus };

export type EntityTagWithTag = EntityTag & { tag: Tag };

export type PendingChangeWithEntity = PendingChange & {
  entity: {
    id: string;
    name: string;
    slug: string;
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
}>;

// For suggestion pages
export type SuggestionWithEntity = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  website: string | null;
  submitterEmail: string;
  submitterName: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

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
