import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatPhoneForDisplay } from "@/lib/phone";

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

// Deprecated: use formatPhoneForDisplay from "@/lib/phone"
export const formatPhoneNumber = formatPhoneForDisplay;

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

/**
 * Validates that a URL has a proper structure with a valid TLD.
 * Requires at least a domain.tld pattern (e.g., example.com).
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Must be http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    const hostname = urlObj.hostname;
    
    // Must have at least one dot (domain.tld)
    if (!hostname.includes('.')) {
      return false;
    }
    
    // Split into parts
    const parts = hostname.split('.');
    
    // Must have at least 2 parts (domain + tld)
    if (parts.length < 2) {
      return false;
    }
    
    // TLD (last part) must be at least 2 characters and at most 14 characters
    // (longest current TLD is .cancerresearch at 14 chars)
    const tld = parts[parts.length - 1];
    if (tld.length < 2 || tld.length > 14) {
      return false;
    }
    
    // The second-level domain (the part before TLD) must exist and be reasonable length
    const secondLevel = parts[parts.length - 2];
    if (!secondLevel || secondLevel.length < 1 || secondLevel.length > 63) {
      return false;
    }
    
    // Each part must be valid (alphanumeric + hyphens, but not start/end with hyphen)
    for (const part of parts) {
      if (!part || part.length === 0) return false;
      if (part.startsWith('-') || part.endsWith('-')) return false;
      if (!/^[a-z0-9-]+$/i.test(part)) return false;
    }
    
    // If the domain has "www" as first part, ensure there are at least 3 parts total
    // (www.example.com, not www.example)
    if (parts[0].toLowerCase() === 'www' && parts.length < 3) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export function formatAddress(address: string): string {
  return address.trim();
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

