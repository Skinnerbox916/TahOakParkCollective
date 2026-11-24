import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/geocoding", () => ({
  geocodeAddress: vi.fn(async (address: string) =>
    address.includes("Nowhere") ? null : { latitude: 38.545, longitude: -121.45, displayName: address }
  ),
}));

import { prisma } from "@/lib/prisma";
import {
  AlreadyProcessedError,
  ConflictError,
  ForbiddenError,
  NoChangesError,
  StaleVersionError,
  ValidationError,
  approveApproval,
  deleteEntity,
  proposeNewEntity,
  proposeUpdate,
  rebaseApproval,
  rejectApproval,
  type Actor,
} from "@/lib/entities";

let admin: Actor;
let owner: Actor;
let stranger: Actor;

async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "Approval", "EntityTag", "IssueReport", "Entity", "Tag", "Category", "User" RESTART IDENTITY CASCADE`
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
    prisma.user.create({ data: { email: "admin@test.local", roles: ["USER", "ADMIN"] } }),
    prisma.user.create({ data: { email: "owner@test.local", roles: ["USER"] } }),
    prisma.user.create({ data: { email: "stranger@test.local", roles: ["USER"] } }),
  ]);
  admin = { id: a.id, roles: ["USER", "ADMIN"], email: a.email };
  owner = { id: o.id, roles: ["USER"], email: o.email };
  stranger = { id: s.id, roles: ["USER"], email: s.email };
}

/** An ACTIVE entity owned by `owner`, created the way an admin would. */
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
    { source: "admin", ownerId: owner.id! }
  );
  return entityId!;
}

const entity = (id: string) =>
  prisma.entity.findUniqueOrThrow({ where: { id }, include: { tags: { include: { tag: true } }, categories: true } });

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
    await expect(proposeUpdate(owner, id, { status: "PENDING_REVIEW" }, { source: "owner" })).rejects.toBeInstanceOf(
      ValidationError
    );
    // ownerId isn't a field: it's ignored rather than applied.
    await expect(proposeUpdate(owner, id, { ownerId: stranger.id }, { source: "owner" })).rejects.toBeInstanceOf(
      NoChangesError
    );
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
    const created = await prisma.entity.findMany({ where: { name: "Taqueria" } });
    expect(created).toHaveLength(1);
    expect(created[0].ownerId).toBe(owner.id);
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

  it("turns an owner's delete into a removal request", async () => {
    const id = await seedEntity();
    const { approval, pending } = await proposeUpdate(owner, id, { status: "INACTIVE" }, { source: "owner" });
    expect(pending).toBe(true);
    expect((await entity(id)).status).toBe("ACTIVE");

    await approveApproval(admin, approval.id);
    expect((await entity(id)).status).toBe("INACTIVE");
  });

  it("rejects without touching the entity", async () => {
    const id = await seedEntity();
    const { approval } = await proposeUpdate(owner, id, { description: "Nope" }, { source: "owner" });
    await rejectApproval(admin, approval.id, "No thanks");
    expect((await entity(id)).description).toBe("Coffee");
    await expect(approveApproval(admin, approval.id)).rejects.toBeInstanceOf(AlreadyProcessedError);
  });

  it("transfers ownership on an approved claim without wiping translations", async () => {
    const id = await seedEntity();
    const current = await entity(id);
    const claim = await prisma.approval.create({
      data: {
        type: "UPDATE_ENTITY",
        status: "PENDING",
        targetEntityId: id,
        payload: {},
        baseValues: {},
        baseVersion: current.version,
        submittedBy: stranger.id,
        source: "claim",
      },
    });
    await approveApproval(admin, claim.id);
    const after = await entity(id);
    expect(after.ownerId).toBe(stranger.id);
    expect(after.nameTranslations).toEqual({ en: "Corner Cafe", es: "Café de la Esquina" });
  });
});

describe("slugs and deletes", () => {
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
