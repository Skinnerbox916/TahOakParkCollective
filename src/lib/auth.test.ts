import { afterAll, beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { auth, verifyAnyPassword } from "@/lib/better-auth";
import { toSessionUser } from "@/lib/auth";
import { consoleOutbox } from "@/lib/email";
import { consume } from "@/lib/rate-limit";
import type { AuthSession } from "@/lib/better-auth";

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "AuthSession", "AuthAccount", "AuthVerification", "Passkey", "TwoFactor", "EntityMember", "User" RESTART IDENTITY CASCADE`
  );
  consoleOutbox.length = 0;
});
afterAll(() => prisma.$disconnect());

const fakeSession = (role: string, strongAuth: boolean) =>
  ({
    user: { id: "u1", email: "a@b.c", name: "A", role },
    session: { id: "s1", token: "t", strongAuth },
  }) as unknown as AuthSession;

/** The code from the most recent email to `email`, waiting briefly for it to be "sent". */
async function lastCode(email: string): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const mail = [...consoleOutbox].reverse().find((m) => m.to === email);
    const code = mail?.text.match(/\b(\d{6})\b/)?.[1];
    if (code) return code;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`no code emailed to ${email}`);
}

describe("admin powers need a strong session", () => {
  it("gives ADMIN only to an admin whose session used a passkey or authenticator", () => {
    expect(toSessionUser(fakeSession("admin", true))).toMatchObject({ roles: ["USER", "ADMIN"], adminNeedsStepUp: false });
    expect(toSessionUser(fakeSession("admin", false))).toMatchObject({ roles: ["USER"], adminNeedsStepUp: true });
    expect(toSessionUser(fakeSession("user", true))).toMatchObject({ roles: ["USER"], adminNeedsStepUp: false });
  });
});

describe("passwords", () => {
  it("accepts legacy bcrypt hashes and Better Auth's scrypt hashes", async () => {
    const legacy = await bcrypt.hash("old-password", 10);
    expect(await verifyAnyPassword({ hash: legacy, password: "old-password" })).toBe(true);
    expect(await verifyAnyPassword({ hash: legacy, password: "wrong" })).toBe(false);

    const ctx = await auth.$context;
    const modern = await ctx.password.hash("new-password");
    expect(await verifyAnyPassword({ hash: modern, password: "new-password" })).toBe(true);
  });

  it("signs in a migrated bcrypt account and re-hashes it with scrypt", async () => {
    const user = await prisma.user.create({ data: { email: "legacy@test.local", name: "Legacy", emailVerified: true } });
    await prisma.authAccount.create({
      data: {
        id: "acc-legacy",
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: await bcrypt.hash("old-password", 10),
      },
    });

    const result = await auth.api.signInEmail({ body: { email: "legacy@test.local", password: "old-password" } });
    expect(result.user.id).toBe(user.id);
    const account = await prisma.authAccount.findUniqueOrThrow({ where: { id: "acc-legacy" } });
    expect(account.password?.startsWith("$2")).toBe(false);

    // ...and the new hash still works
    await auth.api.signInEmail({ body: { email: "legacy@test.local", password: "old-password" } });
  });
});

describe("sign-up and sign-in", () => {
  it("confirms the email with a code before the first sign-in", async () => {
    await auth.api.signUpEmail({ body: { name: "New Owner", email: "new@test.local", password: "a-long-password" } });
    const created = await prisma.user.findUniqueOrThrow({ where: { email: "new@test.local" } });
    expect(created.emailVerified).toBe(false);

    await expect(
      auth.api.signInEmail({ body: { email: "new@test.local", password: "a-long-password" } })
    ).rejects.toMatchObject({ body: { code: "EMAIL_NOT_VERIFIED" } });

    const code = await lastCode("new@test.local");
    await auth.api.verifyEmailOTP({ body: { email: "new@test.local", otp: code } });
    expect((await prisma.user.findUniqueOrThrow({ where: { email: "new@test.local" } })).emailVerified).toBe(true);

    const signedIn = await auth.api.signInEmail({ body: { email: "new@test.local", password: "a-long-password" } });
    const session = await prisma.authSession.findFirstOrThrow({ where: { token: signedIn.token } });
    expect(session.strongAuth).toBe(false); // a password alone never grants admin powers
  });

  it("signs in with an emailed code but never creates accounts that way", async () => {
    await auth.api.sendVerificationOTP({ body: { email: "nobody@test.local", type: "sign-in" } });
    await expect(
      auth.api.signInEmailOTP({ body: { email: "nobody@test.local", otp: "000000" } })
    ).rejects.toBeTruthy();
    expect(await prisma.user.count({ where: { email: "nobody@test.local" } })).toBe(0);

    await prisma.user.create({ data: { email: "coder@test.local", name: "Coder", emailVerified: true } });
    await auth.api.sendVerificationOTP({ body: { email: "coder@test.local", type: "sign-in" } });
    const result = await auth.api.signInEmailOTP({
      body: { email: "coder@test.local", otp: await lastCode("coder@test.local") },
    });
    expect(result.user.email).toBe("coder@test.local");
  });

  it("refuses banned users", async () => {
    const user = await prisma.user.create({
      data: { email: "banned@test.local", name: "Banned", emailVerified: true, banned: true },
    });
    const ctx = await auth.$context;
    await prisma.authAccount.create({
      data: {
        id: "acc-banned",
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: await ctx.password.hash("a-long-password"),
      },
    });
    await expect(
      auth.api.signInEmail({ body: { email: "banned@test.local", password: "a-long-password" } })
    ).rejects.toBeTruthy();
  });
});

describe("public form rate limits", () => {
  it("allows a burst up to the limit, then asks to retry later", () => {
    const key = `test:${Math.random()}`;
    expect(consume(key, 2, 60_000).ok).toBe(true);
    expect(consume(key, 2, 60_000).ok).toBe(true);
    const third = consume(key, 2, 60_000);
    expect(third.ok).toBe(false);
    expect(third.retryAfter).toBeGreaterThan(0);
  });
});
