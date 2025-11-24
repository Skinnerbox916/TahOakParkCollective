import type { Entity, Category, User, Prisma } from "@prisma/client";
import type { Role, BusinessStatus, EntityType } from "@/lib/prismaEnums";

export type { Entity, Category, User, Role, BusinessStatus, EntityType };

export type EntityWithRelations = Prisma.EntityGetPayload<{
  include: {
    category: true;
    owner: true;
  };
}>;

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
}

export interface EntityFormData {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  categoryId?: string;
  entityType?: EntityType;
  hours?: BusinessHours;
  socialMedia?: SocialMediaLinks;
}

