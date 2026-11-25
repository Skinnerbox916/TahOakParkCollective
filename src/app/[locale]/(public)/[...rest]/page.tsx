import { notFound } from "next/navigation";

/**
 * Any URL under a locale that no other route matches. Calling notFound() here
 * renders (public)/not-found.tsx inside the site layout, in the visitor's
 * language, instead of Next's bare default 404.
 */
export default function CatchAll() {
  notFound();
}
