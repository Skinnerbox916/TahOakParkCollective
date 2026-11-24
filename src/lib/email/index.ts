/**
 * Every email the site sends, in English and Spanish. Plain, short, and
 * readable as text: most people only need the code or the link.
 */
import { appName, siteUrl, type SiteLocale } from "@/lib/site";
import { sendMail } from "./mailer";

export { consoleOutbox } from "./mailer";

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Paragraphs are HTML (escape them first); a code renders large between them. */
function layout(before: string[], code?: string, after: string[] = []): string {
  const p = (html: string) => `<p style="margin:0 0 16px">${html}</p>`;
  const codeHtml = code
    ? `<p style="margin:0 0 16px;font-size:28px;font-weight:700;letter-spacing:6px">${escapeHtml(code)}</p>`
    : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1f2937;max-width:520px">
<p style="margin:0 0 16px;font-weight:700">${escapeHtml(appName())}</p>${before.map(p).join("")}${codeHtml}${after.map(p).join("")}</div>`;
}

export type AuthCodeType = "sign-in" | "email-verification" | "forget-password" | "change-email";

const CODE_COPY: Record<SiteLocale, Record<AuthCodeType, { subject: string; intro: string }>> = {
  en: {
    "sign-in": { subject: "Your sign-in code", intro: "Use this code to sign in:" },
    "email-verification": { subject: "Confirm your email", intro: "Use this code to confirm your email address:" },
    "forget-password": { subject: "Reset your password", intro: "Use this code to choose a new password:" },
    "change-email": { subject: "Confirm your new email", intro: "Use this code to confirm your new email address:" },
  },
  es: {
    "sign-in": { subject: "Tu código para iniciar sesión", intro: "Usa este código para iniciar sesión:" },
    "email-verification": { subject: "Confirma tu correo", intro: "Usa este código para confirmar tu correo electrónico:" },
    "forget-password": { subject: "Restablece tu contraseña", intro: "Usa este código para elegir una contraseña nueva:" },
    "change-email": { subject: "Confirma tu nuevo correo", intro: "Usa este código para confirmar tu nuevo correo electrónico:" },
  },
};

const CODE_FOOTER: Record<SiteLocale, string> = {
  en: "The code expires in 10 minutes. If you didn't ask for it, you can ignore this email.",
  es: "El código vence en 10 minutos. Si no lo pediste, puedes ignorar este correo.",
};

/** A 6-digit code for sign-in, verification, password reset or email change. */
export function sendAuthCode(to: string, code: string, type: AuthCodeType, locale: SiteLocale) {
  const copy = CODE_COPY[locale][type];
  return sendMail({
    to,
    subject: `${copy.subject}: ${code}`,
    text: `${appName()}\n\n${copy.intro}\n\n${code}\n\n${CODE_FOOTER[locale]}`,
    html: layout([escapeHtml(copy.intro)], code, [escapeHtml(CODE_FOOTER[locale])]),
  });
}

/** Newsletter double opt-in (subscribers aren't user accounts). */
export function sendSubscriptionVerification(to: string, token: string, locale: SiteLocale) {
  const url = `${siteUrl()}/${locale}/subscribe/verify?token=${encodeURIComponent(token)}`;
  const copy =
    locale === "es"
      ? {
          subject: "Confirma tu suscripción",
          intro: "Confirma tu correo para recibir novedades:",
          footer: "El enlace vence en 7 días. Si no te suscribiste, ignora este correo.",
        }
      : {
          subject: "Confirm your subscription",
          intro: "Confirm your email to get updates:",
          footer: "The link expires in 7 days. If you didn't subscribe, ignore this email.",
        };
  return sendMail({
    to,
    subject: copy.subject,
    text: `${appName()}\n\n${copy.intro}\n${url}\n\n${copy.footer}`,
    html: layout([
      escapeHtml(copy.intro),
      `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`,
      escapeHtml(copy.footer),
    ]),
  });
}

/** Tell an admin someone wants to manage a listing (admins read English). */
export function sendClaimNotification(to: string, entityName: string, claimantEmail: string) {
  const url = `${siteUrl()}/en/admin/approvals?type=CLAIM_ENTITY`;
  const intro = `${claimantEmail} asked to manage "${entityName}".`;
  return sendMail({
    to,
    subject: `New claim: ${entityName}`,
    text: `${intro}\n\nReview it: ${url}`,
    html: layout([escapeHtml(intro), `<a href="${escapeHtml(url)}">Review the claim</a>`]),
  });
}
