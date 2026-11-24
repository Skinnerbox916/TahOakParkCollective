import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { createErrorResponse, createSuccessResponse, withAuth } from "@/lib/api-helpers";
import { auth } from "@/lib/better-auth";

/**
 * POST { newPassword } - add a password to an account that signs in with
 * passkeys or emailed codes. (Changing an existing password goes through
 * Better Auth's /change-password, which needs the current one.)
 */
export async function POST(request: NextRequest) {
  return withAuth(async () => {
    try {
      const { newPassword } = await request.json();
      if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) {
        return createErrorResponse("Password must be 8 to 128 characters", 400, undefined, { code: "PASSWORD_TOO_SHORT" });
      }
      await auth.api.setPassword({ body: { newPassword }, headers: await headers() });
      return createSuccessResponse(null, "Password set");
    } catch (error) {
      const code = (error as { body?: { code?: string } })?.body?.code;
      if (code) return createErrorResponse("Could not set password", 400, undefined, { code });
      console.error("Error setting password:", error);
      return createErrorResponse("Could not set password", 500);
    }
  });
}
