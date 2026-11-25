import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/geocoding", () => ({
  geocodeAddress: vi.fn(async (address: string) =>
    address.includes("Nowhere") ? null : { latitude: 38.545, longitude: -121.45, displayName: address }
  ),
}));

import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import {
  AlreadyProcessedError,
  ConflictError,
  ConsentRequiredError,
  EntityServiceError,
  ForbiddenError,
  LISTING_TERMS_VERSION,
  NoChangesError,
  StaleVersionError,
  ValidationError,
  acceptShareLink,
  addMember,
  approveApproval,
  createShareLink,
  listMembers,
  listShareLinks,
  lookupShareLink,
  removeMember,
  deleteEntity,
  proposeNewEntity,
  proposeUpdate,
  publishListing,
  rebaseApproval,
  rejectApproval,
  revokeShareLink,
  unpublishListing,
  type Actor,
} from "@/lib/entities";

let admin: Actor;
let owner: Actor;
let stranger: Actor;

async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "Approval", "EntityShareLink", "EntityMember", "EntityTag", "IssueReport", "Entity", "Tag", "Category", "AuthSession", "AuthAccount", "AuthVerification", "Passkey", "TwoFactor", "User" RESTART IDENTITY CASCADE`
  );
  await prisma.category.createMany({
    data: [
      { name: "Food", slug: "food", entityTypes: ["COMMERCE"] },
      { name: "Parks", slug: "parks", entityTypes: ["PUBLIC_SPACE"] },
    ],
  });
  await prisma.tag.createMany({
    data: [
      { name: "Kid friendly", slug: "kid-friendly", category: "FRIENDLINESS" },
      { name: "Wifi", slug: "wifi", category: "AMENITY" },
      { name: "Black owned", slug: "black-owned", category: "IDENTITY" },
    ],
  });
  const [a, o, s] = await Promise.all([
    prisma.user.create({ data: { email: "admin@test.local", name: "Admin", role: "admin" } }),
    prisma.user.create({ data: { email: "owner@test.local", name: "Owner" } }),
    prisma.user.create({ data: { email: "stranger@test.local", name: "Stranger" } }),
  ]);
  admin = { id: a.id, roles: ["USER", "ADMIN"], email: a.email };
  owner = { id: o.id, roles: ["USER"], email: o.email };
  stranger = { id: s.id, roles: ["USER"], email: s.email };
}

/** A business owned by `owner`, created the way an admin would: a private draft until published. */
async function seedEntity(overrides: Record<string, unknown> = {}) {
  const { entityId } = await proposeNewEntity(
    admin,
    {
      name: "Corner Cafe",
      description: "Coffee",
      nameTranslations: { en: "Corner Cafe", es: "Café de la Esquina" },
      address: "123 Main St",
      phone: "+19165550100",
      categorySlugs: ["food"],
      tagSlugs: ["wifi"],
      ...overrides,
    },
    { source: "admin", initialOwnerId: owner.id! }
  );
  return entityId!;
}

const entity = (id: string) =>
  prisma.entity.findUniqueOrThrow({
    where: { id },
    include: { tags: { include: { tag: true } }, categories: true, members: true },
  });

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe("proposals", () => {
  it("stores only the fields an owner changed, and leaves the entity alone", async () => {
    const id = await seedEntity();
    const before = await entity(id);

    // An edit form sends the whole listing back, formatted for display.
    const { approval, pending } = await proposeUpdate(
      owner,
      id,
      {
        name: "Corner Cafe",
        description: "Coffee and pastries",
        phone: "(916) 555-0100",
        nameTranslations: { es: "Café de la Esquina", en: "Corner Cafe" },
        categorySlugs: ["food"],
        tagSlugs: ["wifi"],
      },
      { source: "owner", expectedVersion: before.version }
    );

    expect(pending).toBe(true);
    expect(approval.payload).toEqual({ description: "Coffee and pastries" });
    expect(approval.baseValues).toEqual({ description: "Coffee" });
    expect(approval.baseVersion).toBe(before.version);
    expect((await entity(id)).description).toBe("Coffee");
  });

  it("treats an unchanged edit form as no change", async () => {
    const id = await seedEntity();
    const current = await entity(id);
    await expect(
      proposeUpdate(
        owner,
        id,
        {
          name: current.name,
          description: current.description,
          phone: "916-555-0100",
          address: current.address,
          categorySlugs: ["food"],
          tagSlugs: ["wifi"],
          latitude: current.latitude,
          longitude: current.longitude,
        },
        { source: "owner" }
      )
    ).rejects.toBeInstanceOf(NoChangesError);
  });

  it("applies admin changes immediately and bumps the version", async () => {
    const id = await seedEntity();
    const { approval, pending, version } = await proposeUpdate(admin, id, { phone: "916-555-0199" }, { source: "admin" });

    expect(pending).toBe(false);
    expect(approval.status).toBe("APPROVED");
    expect(approval.entityId).toBe(id);
    const after = await entity(id);
    expect(after.phone).toBe("+19165550199");
    expect(after.version).toBe(version);
    expect(after.version).toBe(2);
  });

  it("refuses a save from a form loaded before someone else's change", async () => {
    const id = await seedEntity();
    await proposeUpdate(admin, id, { phone: "916-555-0199" }, { source: "admin" });
    await expect(
      proposeUpdate(admin, id, { description: "Later edit" }, { source: "admin", expectedVersion: 1 })
    ).rejects.toBeInstanceOf(StaleVersionError);
  });

  it("only lets admins and the owner propose changes", async () => {
    const id = await seedEntity();
    await expect(proposeUpdate(stranger, id, { description: "Mine now" }, { source: "owner" })).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });

  it("keeps admin-only fields away from owners", async () => {
    const id = await seedEntity();
    await expect(proposeUpdate(owner, id, { featured: true }, { source: "owner" })).rejects.toBeInstanceOf(
      ValidationError
    );
    // Owners publish and unpublish instead of proposing a status.
    await expect(proposeUpdate(owner, id, { status: "ACTIVE" }, { source: "owner" })).rejects.toBeInstanceOf(
      ValidationError
    );
    // ownerId isn't a field: it's ignored rather than applied.
    await expect(proposeUpdate(owner, id, { ownerId: stranger.id }, { source: "owner" })).rejects.toBeInstanceOf(
      NoChangesError
    );
  });

  it("keeps the English translation equal to the name and description", async () => {
    const id = await seedEntity();
    // An owner renames it: the English shown on /en follows; the Spanish stays.
    const { approval } = await proposeUpdate(owner, id, { name: "Corner Coffee" }, { source: "owner" });
    expect(approval.payload).toEqual({
      name: "Corner Coffee",
      nameTranslations: { en: "Corner Coffee", es: "Café de la Esquina" },
    });
    await approveApproval(admin, approval.id);
    const after = await entity(id);
    // Display reads the "en" entry first (getTranslatedField), so it must follow the name.
    expect(after.nameTranslations).toEqual({ en: "Corner Coffee", es: "Café de la Esquina" });

    // A stale English translation (say from an AI draft) never wins over the plain field,
    // and with no other language there's nothing to store.
    const { entityId } = await proposeNewEntity(
      admin,
      {
        name: "Bakery",
        description: "Bread",
        categorySlugs: ["food"],
        nameTranslations: { en: "Old Bakery", es: "Panadería" },
        descriptionTranslations: { en: "Old text" },
      },
      { source: "admin" }
    );
    const created = await entity(entityId!);
    expect(created.nameTranslations).toEqual({ en: "Bakery", es: "Panadería" });
    expect(created.descriptionTranslations).toBeNull();

    // Editing only the Spanish leaves the English alone.
    await proposeUpdate(admin, entityId!, { nameTranslations: { es: "La Panadería" } }, { source: "admin" });
    expect((await entity(entityId!)).nameTranslations).toEqual({ en: "Bakery", es: "La Panadería" });
  });

  it("geocodes a changed address, and clears the pin when it can't be found", async () => {
    const id = await seedEntity({ address: null, latitude: null, longitude: null });

    await proposeUpdate(admin, id, { address: "456 Oak Ave" }, { source: "admin" });
    expect((await entity(id)).latitude).toBe(38.545);

    const { approval } = await proposeUpdate(admin, id, { address: "1 Nowhere Rd" }, { source: "admin" });
    expect(approval.checks).toMatchObject({ geocodeFailed: true });
    expect((await entity(id)).latitude).toBeNull();
  });
});

describe("approvals", () => {
  it("applies an owner's proposal once; a second approve is refused", async () => {
    const id = await seedEntity();
    const { approval } = await proposeUpdate(owner, id, { description: "New" }, { source: "owner" });

    const results = await Promise.allSettled([
      approveApproval(admin, approval.id),
      approveApproval(admin, approval.id),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(AlreadyProcessedError);

    const after = await entity(id);
    expect(after.description).toBe("New");
    expect(after.version).toBe(2);
  });

  it("creates exactly one entity from a new-listing proposal, owned by the submitter", async () => {
    const { approval, pending } = await proposeNewEntity(
      owner,
      { name: "Taqueria", categorySlugs: ["food"], featured: true },
      { source: "owner" }
    );
    expect(pending).toBe(true);

    await Promise.allSettled([approveApproval(admin, approval.id), approveApproval(admin, approval.id)]);
    const created = await prisma.entity.findMany({ where: { name: "Taqueria" }, include: { members: true } });
    expect(created).toHaveLength(1);
    expect(created[0].members).toMatchObject([{ userId: owner.id, role: "OWNER" }]);
    expect(created[0].featured).toBe(false); // owners can't set admin-only fields on new listings
  });

  it("refuses to approve over a newer change to the same field, until rebased", async () => {
    const id = await seedEntity();
    const { approval } = await proposeUpdate(owner, id, { phone: "916-555-0111" }, { source: "owner" });
    await proposeUpdate(admin, id, { phone: "916-555-0122" }, { source: "admin" });

    await expect(approveApproval(admin, approval.id)).rejects.toBeInstanceOf(ConflictError);
    const stillPending = await prisma.approval.findUniqueOrThrow({ where: { id: approval.id } });
    expect(stillPending.status).toBe("PENDING");
    expect((await entity(id)).phone).toBe("+19165550122");

    await rebaseApproval(admin, approval.id, { phone: "916-555-0111" });
    await approveApproval(admin, approval.id);
    expect((await entity(id)).phone).toBe("+19165550111");
  });

  it("applies a proposal cleanly when only other fields changed since", async () => {
    const id = await seedEntity();
    const { approval } = await proposeUpdate(owner, id, { description: "Owner text" }, { source: "owner" });
    await proposeUpdate(admin, id, { phone: "916-555-0122" }, { source: "admin" });

    await approveApproval(admin, approval.id);
    const after = await entity(id);
    expect(after.description).toBe("Owner text");
    expect(after.phone).toBe("+19165550122");
  });

  it("keeps existing tags' verification and author, and translations, when tags change", async () => {
    const id = await seedEntity({ tagSlugs: ["wifi", "kid-friendly"] });
    await prisma.entityTag.updateMany({
      where: { entityId: id, tag: { slug: "kid-friendly" } },
      data: { verified: false, createdBy: "someone" },
    });

    const { approval } = await proposeUpdate(
      owner,
      id,
      { tagSlugs: ["wifi", "kid-friendly", "black-owned"] },
      { source: "owner" }
    );
    await approveApproval(admin, approval.id);

    const after = await entity(id);
    const bySlug = Object.fromEntries(after.tags.map((t) => [t.tag.slug, t]));
    expect(Object.keys(bySlug).sort()).toEqual(["black-owned", "kid-friendly", "wifi"]);
    expect(bySlug["kid-friendly"]).toMatchObject({ verified: false, createdBy: "someone" });
    expect(bySlug["black-owned"]).toMatchObject({ verified: true, createdBy: owner.id });
    expect(after.nameTranslations).toEqual({ en: "Corner Cafe", es: "Café de la Esquina" });
  });

  it("rejects without touching the entity", async () => {
    const id = await seedEntity();
    const { approval } = await proposeUpdate(owner, id, { description: "Nope" }, { source: "owner" });
    await rejectApproval(admin, approval.id, "No thanks");
    expect((await entity(id)).description).toBe("Coffee");
    await expect(approveApproval(admin, approval.id)).rejects.toBeInstanceOf(AlreadyProcessedError);
  });
});

const publish = (actor: Actor, id: string) => publishListing(actor, id, { agreedTermsVersion: LISTING_TERMS_VERSION });
const tokenOf = (url: string) => url.split("/").pop()!;

describe("owner opt-in", () => {
  it("keeps businesses private until their owner publishes; parks and civic listings don't wait", async () => {
    const id = await seedEntity();
    expect(await entity(id)).toMatchObject({ status: "INACTIVE", consentedAt: null });

    await expect(proposeUpdate(admin, id, { status: "ACTIVE" }, { source: "admin" })).rejects.toBeInstanceOf(
      ConsentRequiredError
    );
    await expect(
      proposeNewEntity(admin, { name: "Bakery", categorySlugs: ["food"], status: "ACTIVE" }, { source: "admin" })
    ).rejects.toBeInstanceOf(ConsentRequiredError);
    // The database refuses it too, whatever the application does.
    await expect(
      prisma.$executeRawUnsafe(`UPDATE "Entity" SET "status" = 'ACTIVE' WHERE "id" = $1`, id)
    ).rejects.toThrow(/Entity_active_needs_consent/);

    const { entityId: park } = await proposeNewEntity(admin, { name: "Park", categorySlugs: ["parks"], entityType: "PUBLIC_SPACE" }, { source: "admin" });
    const { entityId: office } = await proposeNewEntity(admin, { name: "Library", categorySlugs: ["parks"], entityType: "CIVIC" }, { source: "admin" });
    expect((await entity(park!)).status).toBe("ACTIVE");
    expect((await entity(office!)).status).toBe("ACTIVE");
    // A public park can't quietly become a business.
    await expect(proposeUpdate(admin, park!, { entityType: "COMMERCE" }, { source: "admin" })).rejects.toBeInstanceOf(
      ConsentRequiredError
    );
  });

  it("turns approved suggestions and AI drafts into private, unclaimed drafts", async () => {
    const { approval: suggested } = await proposeNewEntity(
      { id: null, roles: [], email: "visitor@test.local" },
      { name: "Suggested", categorySlugs: ["food"] },
      { source: "public", geocode: false }
    );
    const { approval: drafted } = await proposeNewEntity(
      admin,
      { name: "Drafted", categorySlugs: ["food"] },
      { source: "ai", autoApprove: false }
    );
    for (const approval of [suggested, drafted]) {
      const { entityId, newOwnerId } = await approveApproval(admin, approval.id);
      expect(await entity(entityId)).toMatchObject({ status: "INACTIVE", members: [] });
      expect(newOwnerId).toBeNull();
    }
  });

  it("lets the owner publish, recording the agreement; the owner's unpublish withdraws it", async () => {
    const id = await seedEntity();
    await addMember(admin, id, "stranger@test.local", "MANAGER");

    await expect(publishListing(owner, id, { agreedTermsVersion: "1999-01-01" })).rejects.toMatchObject({
      code: "terms_changed",
    });
    await expect(publish(stranger, id)).rejects.toBeInstanceOf(ForbiddenError); // managers can't
    await expect(publish(admin, id)).rejects.toBeInstanceOf(ForbiddenError); // nor admins

    await publish(owner, id);
    const published = await entity(id);
    expect(published).toMatchObject({
      status: "ACTIVE",
      consentedById: owner.id,
      consentTermsVersion: LISTING_TERMS_VERSION,
    });
    expect(published.consentedAt).toBeInstanceOf(Date);
    const history = await prisma.approval.findFirstOrThrow({ where: { targetEntityId: id, source: "owner" } });
    expect(history).toMatchObject({ status: "APPROVED", payload: { status: "ACTIVE" } });

    // An admin can hide it (say it closed) and bring it back: consent stays.
    await unpublishListing(admin, id);
    expect(await entity(id)).toMatchObject({ status: "INACTIVE", consentedById: owner.id });
    await proposeUpdate(admin, id, { status: "ACTIVE" }, { source: "admin" });
    expect((await entity(id)).status).toBe("ACTIVE");

    // The owner's unpublish is immediate and withdraws consent.
    await expect(unpublishListing(stranger, id)).rejects.toBeInstanceOf(ForbiddenError);
    await unpublishListing(owner, id);
    expect(await entity(id)).toMatchObject({ status: "INACTIVE", consentedAt: null, consentedById: null });
    await expect(proposeUpdate(admin, id, { status: "ACTIVE" }, { source: "admin" })).rejects.toBeInstanceOf(
      ConsentRequiredError
    );
  });

  it("makes an owner's own submission theirs to publish once approved", async () => {
    const { approval } = await proposeNewEntity(
      owner,
      { name: "Taqueria", categorySlugs: ["food"], tagSlugs: ["black-owned"] },
      { source: "owner" }
    );
    const { entityId, newOwnerId } = await approveApproval(admin, approval.id);
    expect(newOwnerId).toBe(owner.id);
    const draft = await entity(entityId);
    expect(draft.status).toBe("INACTIVE");
    expect(draft.tags.map((t) => t.tag.slug)).toEqual(["black-owned"]);

    await publish(owner, entityId);
    expect((await entity(entityId)).status).toBe("ACTIVE");
  });
});

describe("identity tags", () => {
  it("can't be added by admins, AI or the public", async () => {
    const id = await seedEntity();
    await expect(
      proposeUpdate(admin, id, { tagSlugs: ["wifi", "black-owned"] }, { source: "admin" })
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      proposeNewEntity(admin, { name: "A", categorySlugs: ["food"], tagSlugs: ["black-owned"] }, { source: "admin" })
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      proposeNewEntity(admin, { name: "B", categorySlugs: ["food"], tagSlugs: ["black-owned"] }, { source: "ai", autoApprove: false })
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      proposeNewEntity(
        { id: null, roles: [], email: "visitor@test.local" },
        { name: "C", categorySlugs: ["food"], tagSlugs: ["black-owned"] },
        { source: "public", geocode: false }
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("come from the owner; an admin can remove them but not slip new ones into a proposal", async () => {
    const id = await seedEntity();
    const { approval } = await proposeUpdate(owner, id, { tagSlugs: ["wifi", "black-owned"] }, { source: "owner" });
    // Editing the owner's proposal keeps their tag but can't add another.
    await rebaseApproval(admin, approval.id, { tagSlugs: ["wifi", "black-owned", "kid-friendly"] });
    await prisma.tag.create({ data: { name: "Veteran owned", slug: "veteran-owned", category: "IDENTITY" } });
    await expect(
      rebaseApproval(admin, approval.id, { tagSlugs: ["wifi", "black-owned", "veteran-owned"] })
    ).rejects.toBeInstanceOf(ValidationError);
    await approveApproval(admin, approval.id);
    expect((await entity(id)).tags.map((t) => t.tag.slug).sort()).toEqual(["black-owned", "kid-friendly", "wifi"]);

    await proposeUpdate(admin, id, { tagSlugs: ["wifi"] }, { source: "admin" });
    expect((await entity(id)).tags.map((t) => t.tag.slug)).toEqual(["wifi"]);
  });

  it("aren't applied if the proposer is no longer a member when it's approved", async () => {
    const id = await seedEntity();
    await addMember(admin, id, "stranger@test.local", "MANAGER");
    const { approval } = await proposeUpdate(stranger, id, { tagSlugs: ["wifi", "black-owned"] }, { source: "owner" });
    await removeMember(admin, id, stranger.id!);
    await expect(approveApproval(admin, approval.id)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("share links", () => {
  async function draft() {
    const { entityId } = await proposeNewEntity(admin, { name: "Barber", categorySlugs: ["food"] }, { source: "admin" });
    return entityId!;
  }

  it("hands a draft to its owner, who takes it over and publishes it in one step", async () => {
    const id = await draft();
    await expect(createShareLink(owner, id)).rejects.toBeInstanceOf(ForbiddenError);

    const { url } = await createShareLink(admin, id, { email: "barber@test.local", locale: "es" });
    expect(url).toMatch(/\/es\/preview\/[\w-]{40,}$/);
    const token = tokenOf(url);
    expect(await lookupShareLink(token)).toMatchObject({ entityId: id, state: "open" });
    expect(await lookupShareLink("not-a-token")).toBeNull();

    await expect(acceptShareLink({ id: null, roles: [] }, token, { publish: false })).rejects.toBeInstanceOf(ForbiddenError);
    await acceptShareLink(stranger, token, { publish: true, agreedTermsVersion: LISTING_TERMS_VERSION });

    const after = await entity(id);
    expect(after).toMatchObject({ status: "ACTIVE", consentedById: stranger.id });
    expect(after.members).toMatchObject([{ userId: stranger.id, role: "OWNER", addedBy: admin.id }]);
    expect(await lookupShareLink(token)).toMatchObject({ state: "used", usedById: stranger.id });
    await expect(acceptShareLink(owner, token, { publish: false })).rejects.toMatchObject({ code: "link_used" });
  });

  it("can be taken over without publishing; links can be revoked and expire", async () => {
    const id = await draft();
    const first = await createShareLink(admin, id);
    const second = await createShareLink(admin, id);

    await acceptShareLink(owner, tokenOf(first.url), { publish: false });
    expect(await entity(id)).toMatchObject({ status: "INACTIVE", members: [{ userId: owner.id, role: "OWNER" }] });
    // Once someone takes it over, the other links stop working.
    expect(await lookupShareLink(tokenOf(second.url))).toMatchObject({ state: "revoked" });

    const third = await createShareLink(admin, id);
    await revokeShareLink(admin, id, third.link.id);
    await expect(acceptShareLink(stranger, tokenOf(third.url), { publish: false })).rejects.toMatchObject({
      code: "link_revoked",
    });

    const fourth = await createShareLink(admin, id);
    await prisma.entityShareLink.update({ where: { id: fourth.link.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(acceptShareLink(stranger, tokenOf(fourth.url), { publish: false })).rejects.toMatchObject({
      code: "link_expired",
    });
    await expect(
      acceptShareLink(stranger, tokenOf(fourth.url), { publish: true, agreedTermsVersion: "old" })
    ).rejects.toMatchObject({ code: "terms_changed" });

    expect((await listShareLinks(admin, id)).map((l) => l.state)).toEqual(["expired", "revoked", "revoked", "used"]);
    expect((await entity(id)).members).toHaveLength(1);
  });
});

describe("members", () => {
  it("starts admin, AI and public listings unclaimed unless an admin names an owner", async () => {
    const { entityId: direct } = await proposeNewEntity(admin, { name: "Park", categorySlugs: ["parks"], entityType: "PUBLIC_SPACE" }, { source: "admin" });
    expect((await entity(direct!)).members).toEqual([]);

    const { approval } = await proposeNewEntity(
      { id: null, roles: [], email: "visitor@test.local" },
      { name: "Suggested", categorySlugs: ["food"] },
      { source: "public", geocode: false }
    );
    expect(approval.submittedBy).toBeNull();
    const { entityId } = await approveApproval(admin, approval.id);
    expect((await entity(entityId)).members).toEqual([]);
  });

  it("lets admins (only) add and remove members; managers can propose", async () => {
    const id = await seedEntity();
    await expect(addMember(owner, id, "stranger@test.local")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(addMember(admin, id, "nobody@test.local")).rejects.toBeInstanceOf(EntityServiceError);

    await addMember(admin, id, "STRANGER@test.local", "MANAGER");
    expect((await listMembers(id)).map((m) => [m.user.email, m.role])).toEqual([
      ["owner@test.local", "OWNER"],
      ["stranger@test.local", "MANAGER"],
    ]);
    const { pending } = await proposeUpdate(stranger, id, { description: "Manager edit" }, { source: "owner" });
    expect(pending).toBe(true);

    await removeMember(admin, id, stranger.id!);
    await expect(proposeUpdate(stranger, id, { description: "x" }, { source: "owner" })).rejects.toBeInstanceOf(
      ForbiddenError
    );
  });
});

describe("slugs and deletes", () => {
  it("keeps accented letters in slugs as their base letter", async () => {
    expect(generateSlug("Taquería El Güero")).toBe("taqueria-el-guero");
    expect(generateSlug("Peluquería Niño & Señora")).toBe("peluqueria-nino-senora");
    const { entityId } = await proposeNewEntity(admin, { name: "Café Ñoño", categorySlugs: ["food"] }, { source: "admin" });
    expect((await entity(entityId!)).slug).toBe("cafe-nono");
  });

  it("gives same-named listings distinct slugs", async () => {
    const a = await seedEntity();
    const b = await seedEntity();
    const slugs = (await prisma.entity.findMany({ where: { id: { in: [a, b] } } })).map((e) => e.slug).sort();
    expect(slugs).toEqual(["corner-cafe", "corner-cafe-2"]);
  });

  it("keeps approval history when an admin deletes a listing", async () => {
    const id = await seedEntity();
    const { approval } = await proposeUpdate(owner, id, { description: "x" }, { source: "owner" });
    await deleteEntity(admin, id);
    const kept = await prisma.approval.findUniqueOrThrow({ where: { id: approval.id } });
    expect(kept.targetEntityId).toBeNull();
    await expect(deleteEntity(owner, id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
