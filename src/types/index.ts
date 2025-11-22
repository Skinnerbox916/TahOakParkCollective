import type { Business, Category, User, Prisma } from "@prisma/client";
import type { Role, Neighborhood, BusinessStatus } from "@/lib/prismaEnums";

export type { Business, Category, User, Role, Neighborhood, BusinessStatus };

export type BusinessWithRelations = Prisma.BusinessGetPayload<{
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

export interface BusinessFormData {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  categoryId?: string;
  neighborhoods: Neighborhood[];
  hours?: BusinessHours;
  socialMedia?: SocialMediaLinks;
}

