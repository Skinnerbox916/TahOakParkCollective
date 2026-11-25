/**
 * Every email the site sends, in English and Spanish. Plain, short, and
 * readable as text: most people only need the code or the link.
 */
import { appName, siteInbox, siteUrl, type SiteLocale } from "@/lib/site";
import { prisma } from "@/lib/prisma";
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

/**
 * An admin shares a draft listing with its owner. The link opens the listing
 * as it would appear; the owner publishes it from there.
 */
export function sendListingPreview(to: string, entityName: string, url: string, locale: SiteLocale) {
  const copy =
    locale === "es"
      ? {
          subject: `Tu ficha en ${appName()}: ${entityName}`,
          intro: `Preparamos una ficha para "${entityName}" en ${appName()}, un directorio de negocios y organizaciones locales del vecindario. Todavía no es pública.`,
          action: "Mírala aquí. Si te gusta, puedes publicarla en un minuto; si no, no aparecerá:",
          footer: "El enlace es solo para ti y vence en 30 días. Si no tienes relación con este negocio, ignora este correo.",
        }
      : {
          subject: `Your listing on ${appName()}: ${entityName}`,
          intro: `We put together a listing for "${entityName}" on ${appName()}, a directory of local businesses and organizations in the neighborhood. It isn't public yet.`,
          action: "Take a look. If you like it, you can publish it in a minute; if not, it won't appear:",
          footer: "The link is just for you and expires in 30 days. If you're not connected to this business, you can ignore this email.",
        };
  return sendMail({
    to,
    subject: copy.subject,
    text: `${appName()}\n\n${copy.intro}\n\n${copy.action}\n${url}\n\n${copy.footer}`,
    html: layout([
      escapeHtml(copy.intro),
      escapeHtml(copy.action),
      `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`,
      escapeHtml(copy.footer),
    ]),
  });
}

/** An owner's own submission was approved: it's theirs to publish. */
export function sendListingReady(to: string, entityName: string, locale: SiteLocale) {
  const url = `${siteUrl()}/${locale}/portal/dashboard`;
  const copy =
    locale === "es"
      ? {
          subject: `Tu ficha está lista: ${entityName}`,
          intro: `Revisamos "${entityName}". Ya puedes publicarla desde tu panel cuando quieras:`,
        }
      : {
          subject: `Your listing is ready: ${entityName}`,
          intro: `We've reviewed "${entityName}". You can publish it from your dashboard whenever you're ready:`,
        };
  return sendMail({
    to,
    subject: copy.subject,
    text: `${appName()}\n\n${copy.intro}\n${url}`,
    html: layout([escapeHtml(copy.intro), `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`]),
  });
}

/** A contact-form message, to the site inbox, with Reply-To set to the sender. */
export async function sendContactMessage(msg: {
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: SiteLocale;
}) {
  const to = siteInbox();
  if (!to) {
    console.error("[mail] No CONTACT_EMAIL or EMAIL_REPLY_TO set; can't deliver a contact message");
    return false;
  }
  const header = `From ${msg.name} <${msg.email}> · ${msg.subject} · site language: ${msg.locale}`;
  return sendMail({
    to,
    replyTo: msg.email,
    subject: `Contact form: ${msg.subject} (${msg.name})`,
    text: `${header}\n\n${msg.message}`,
    html: layout([escapeHtml(header), escapeHtml(msg.message).replace(/\n/g, "<br>")]),
  });
}

/**
 * Tell the people running the site that something needs them, e.g. a listing
 * waiting for review. English; goes to the site inbox. Never throws.
 */
export async function notifyAdmins(subject: string, lines: string[], path?: string) {
  const to = siteInbox();
  if (!to) return false;
  const url = path ? `${siteUrl()}/en${path}` : null;
  try {
    return await sendMail({
      to,
      subject: `[${appName()}] ${subject}`,
      text: [...lines, ...(url ? [url] : [])].join("\n\n"),
      html: layout([
        ...lines.map((line) => escapeHtml(line)),
        ...(url ? [`<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`] : []),
      ]),
    });
  } catch (error) {
    console.error("[mail] Admin notification failed:", error);
    return false;
  }
}

/** An owner published, unpublished or took over a listing (outreach follow-up). */
export async function notifyPublishChange(
  entityId: string,
  published: boolean,
  ownerEmail?: string | null,
  opts: { tookOver?: boolean } = {}
) {
  const entity = await prisma.entity.findUnique({ where: { id: entityId }, select: { name: true } }).catch(() => null);
  const name = entity?.name ?? entityId;
  const who = ownerEmail ?? "Its owner";
  const subject = published
    ? `Published by its owner: ${name}`
    : opts.tookOver
      ? `Owner took over (not published yet): ${name}`
      : `Unpublished by its owner: ${name}`;
  const line = published
    ? `${who} published it${opts.tookOver ? " from the share link" : ""}.`
    : opts.tookOver
      ? `${who} opened the share link and took the listing over to edit it before publishing.`
      : `${who} took it off the site and withdrew their consent.`;
  return notifyAdmins(subject, [line], `/admin/entities/${entityId}/edit`);
}
