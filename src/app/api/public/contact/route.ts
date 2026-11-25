import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/api-helpers";
import { sendContactMessage } from "@/lib/email";
import { HOUR, isBot, limitRequest } from "@/lib/rate-limit";
import { toLocale } from "@/lib/site";

const SUBJECTS = ["general", "listing", "support", "suggestion", "other"] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The public contact form: emailed to the site inbox, Reply-To the sender. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return createErrorResponse("Invalid request", 400);
    if (isBot(body)) return createSuccessResponse(null, "Message sent");
    const limited = limitRequest(request, "contact", [["ip", 5, HOUR]]);
    if (limited) return limited;

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 5000) : "";
    const subject = SUBJECTS.includes(body.subject) ? (body.subject as string) : "other";
    if (!name || !message || !EMAIL.test(email)) {
      return createErrorResponse("Name, a valid email and a message are required", 400);
    }

    const sent = await sendContactMessage({ name, email, subject, message, locale: toLocale(body.locale) });
    if (!sent) return createErrorResponse("Your message couldn't be sent. Please try again later.", 503);
    return createSuccessResponse(null, "Message sent");
  } catch (error) {
    console.error("Contact form failed:", error);
    return createErrorResponse("Your message couldn't be sent. Please try again later.", 500);
  }
}
