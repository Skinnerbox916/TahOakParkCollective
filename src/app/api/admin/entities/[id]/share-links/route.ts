import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse, entityErrorResponse, withRole } from "@/lib/api-helpers";
import { ROLE } from "@/lib/prismaEnums";
import { createShareLink, listShareLinks, revokeShareLink } from "@/lib/entities";
import { sendListingPreview } from "@/lib/email";
import { toLocale } from "@/lib/site";

type Params = { params: Promise<{ id: string }> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET - the listing's share links (never their tokens)
export async function GET(request: NextRequest, { params }: Params) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      return createSuccessResponse(await listShareLinks(user, id));
    } catch (error) {
      return entityErrorResponse(error, "Failed to load share links");
    }
  });
}

// POST { email?, locale } - make a link; with an email, send it there too.
// The link itself is returned only in this response.
export async function POST(request: NextRequest, { params }: Params) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const body = await request.json().catch(() => ({}));
      const email = typeof body?.email === "string" ? body.email.trim() : "";
      if (email && !EMAIL.test(email)) return createErrorResponse("That email address doesn't look right", 400);
      const locale = toLocale(body?.locale);

      const { link, entity, url } = await createShareLink(user, id, { email: email || null, locale });
      const emailed = email ? await sendListingPreview(email, entity.name, url, locale) : false;
      if (email && !emailed) {
        return createSuccessResponse({ url, linkId: link.id, emailed: false }, "Link created, but the email couldn't be sent");
      }
      return createSuccessResponse({ url, linkId: link.id, emailed }, email ? "Link emailed" : "Link created");
    } catch (error) {
      return entityErrorResponse(error, "Failed to create share link");
    }
  });
}

// DELETE ?linkId= - revoke a link
export async function DELETE(request: NextRequest, { params }: Params) {
  return withRole([ROLE.ADMIN], async (user) => {
    try {
      const { id } = await params;
      const linkId = request.nextUrl.searchParams.get("linkId");
      if (!linkId) return createErrorResponse("linkId is required", 400);
      await revokeShareLink(user, id, linkId);
      return createSuccessResponse(await listShareLinks(user, id), "Link revoked");
    } catch (error) {
      return entityErrorResponse(error, "Failed to revoke share link");
    }
  });
}
