/** Display helpers for a listing's members (safe for client components). */
export interface MemberSummary {
  role: string;
  user: { id?: string; name: string | null; email: string | null };
}

/** The first OWNER's name or email (falling back to any member), or null if unclaimed. */
export function ownerLabel(members: MemberSummary[] | undefined | null): string | null {
  if (!members || members.length === 0) return null;
  const owner = members.find((m) => m.role === "OWNER") ?? members[0];
  return owner.user.name || owner.user.email || null;
}
