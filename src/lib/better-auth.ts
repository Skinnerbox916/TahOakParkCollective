/**
 * Better Auth: accounts, sessions, passkeys, 2FA and emailed codes.
 * Server-only. Pages and API routes use the helpers in src/lib/auth.ts;
 * client components use src/lib/auth-client.ts.
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP, haveIBeenPwned, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { i18n, locales } from "@better-auth/i18n";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { sendAuthCode, type AuthCodeType } from "@/lib/email";
import { appName, localeFromCookieHeader, siteUrl, toLocale, type SiteLocale } from "@/lib/site";

const baseURL = siteUrl();
const isTest = process.env.NODE_ENV === "test";

/**
 * Sign-ins that prove more than knowing an email or password. Admin powers
 * need a session that came from one of these (see src/lib/auth.ts).
 */
const STRONG_AUTH_PATHS = ["/passkey/verify-authentication", "/two-factor/verify-totp", "/two-factor/verify-backup-code"];

/** Accounts from before Better Auth have bcrypt hashes; new ones use scrypt. */
export async function verifyAnyPassword({ hash, password }: { hash: string; password: string }) {
  if (hash.startsWith("$2")) return bcrypt.compare(password, hash);
  return verifyPassword({ hash, password });
}

async function emailLocale(email: string, request?: Request): Promise<SiteLocale> {
  const fromCookie = localeFromCookieHeader(request?.headers.get("cookie"));
  if (fromCookie) return fromCookie;
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { locale: true },
  });
  return toLocale(user?.locale);
}

export const auth = betterAuth({
  appName: appName(),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql", transaction: true }),

  user: {
    additionalFields: {
      // Language for emails; follows the site's language at sign-up.
      locale: { type: "string", required: false, defaultValue: "en", input: true },
    },
  },
  session: {
    modelName: "authSession",
    expiresIn: 60 * 60 * 24 * 30, // members visit rarely; stay signed in for 30 days
    updateAge: 60 * 60 * 24,
    // No cookie cache: role changes, bans and sign-outs apply on the next request.
    additionalFields: {
      strongAuth: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  account: { modelName: "authAccount" },
  verification: { modelName: "authVerification" },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
    password: { hash: hashPassword, verify: verifyAnyPassword },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },

  rateLimit: {
    enabled: !isTest,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-in/email-otp": { window: 60, max: 5 },
      "/sign-up/email": { window: 600, max: 5 },
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/email-otp/request-password-reset": { window: 60, max: 3 },
      "/two-factor/*": { window: 60, max: 5 },
      "/passkey/verify-authentication": { window: 60, max: 10 },
    },
  },
  advanced: {
    // Production sits behind the Cloudflare tunnel, which sets cf-connecting-ip.
    ipAddress: { ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"] },
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession;

      if (STRONG_AUTH_PATHS.includes(ctx.path)) {
        // Mark the new session strong. Verifying a TOTP code while already
        // signed in (turning on 2FA) strengthens the current session.
        const sessionId =
          newSession?.session.id ?? (await getSessionFromCtx(ctx).catch(() => null))?.session.id;
        if (sessionId) {
          await prisma.authSession.update({ where: { id: sessionId }, data: { strongAuth: true } });
        }
      }

      // Re-hash legacy bcrypt passwords with scrypt the first time they're used.
      if (ctx.path === "/sign-in/email" && newSession && typeof ctx.body?.password === "string") {
        const account = await prisma.authAccount.findFirst({
          where: { userId: newSession.user.id, providerId: "credential" },
          select: { id: true, password: true },
        });
        if (account?.password?.startsWith("$2")) {
          await prisma.authAccount.update({
            where: { id: account.id },
            data: { password: await hashPassword(ctx.body.password) },
          });
        }
      }
    }),
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      // New accounts come from the sign-up form, not from requesting a code.
      disableSignUp: true,
      // Changing your email needs a code sent to the new address.
      changeEmail: { enabled: true },
      // Verification emails are codes too: they work when the email is read
      // on another device or inside an app's built-in browser.
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }, ctx) {
        const locale = await emailLocale(email, ctx?.request);
        void sendAuthCode(email, otp, type as AuthCodeType, locale);
      },
    }),
    passkey({
      rpID: new URL(baseURL).hostname,
      rpName: appName(),
      origin: baseURL,
    }),
    twoFactor({ issuer: appName() }),
    admin({ defaultRole: "user", adminRoles: ["admin"] }),
    haveIBeenPwned({
      enabled: !isTest,
      paths: ["/sign-up/email", "/change-password", "/reset-password", "/email-otp/reset-password", "/set-password", "/admin/create-user", "/admin/set-user-password"],
    }),
    // Error messages in the visitor's language (next-intl's cookie, then the
    // browser's), falling back to the user's saved language.
    i18n({
      translations: { en: locales.en, es: locales.es },
      defaultLocale: "en",
      detection: ["cookie", "header", "session"],
      localeCookie: "NEXT_LOCALE",
      userLocaleField: "locale",
    }),
    nextCookies(), // must stay last
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
