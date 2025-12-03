import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for combining class names with proper Tailwind class merging
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export function formatPhoneNumber(phone: string): string {
  // US phone number formatting: (XXX) XXX-XXXX
  const cleaned = phone.replace(/\D/g, "");
  
  // Handle 10-digit US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Handle 11-digit US numbers with leading 1
  if (cleaned.length === 11 && cleaned[0] === "1") {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if doesn't match US patterns (e.g., international numbers)
  return phone.trim();
}

/**
 * Normalizes a URL by adding https:// if no protocol is present.
 * Returns empty string for empty input, leaves other protocols intact.
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  
  // Already has http(s)://
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  
  // Has another protocol (ftp://, mailto:, etc.) - leave as is
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  
  // Add https:// by default
  return `https://${trimmed}`;
}

export function formatAddress(address: string): string {
  return address.trim();
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

