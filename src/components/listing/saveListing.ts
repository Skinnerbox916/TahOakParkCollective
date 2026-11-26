/**
 * The listing editor's one submit path. Create is POST /api/entities, edit is
 * PUT /api/entities/[id] (with the version the form loaded, so a stale save
 * is refused), and review is PATCH /api/admin/approvals/[id] (an admin
 * editing a pending proposal, which rebases it).
 */
import type { EditorMode } from "./values";

export type SaveResult =
  | { kind: "created"; entityId: string; entity: Record<string, unknown> }
  | { kind: "pending"; approvalId: string }
  | { kind: "saved"; entity: Record<string, unknown> }
  | { kind: "proposalSaved"; approval: Record<string, unknown> };

/** A refused save: `code` is the server's error code, `fieldErrors` its per-field message keys. */
export class SaveError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly fieldErrors: Record<string, string> = {},
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export async function saveListing(opts: {
  mode: EditorMode;
  payload: Record<string, unknown>;
  entityId?: string;
  approvalId?: string;
  version?: number;
}): Promise<SaveResult> {
  const { mode, payload } = opts;
  const request =
    mode === "create"
      ? { url: "/api/entities", method: "POST", body: payload }
      : mode === "edit"
        ? { url: `/api/entities/${opts.entityId}`, method: "PUT", body: { ...payload, version: opts.version } }
        : { url: `/api/admin/approvals/${opts.approvalId}`, method: "PATCH", body: { fields: payload } };

  let response: Response;
  let data: {
    success?: boolean;
    data?: Record<string, unknown>;
    error?: string;
    code?: string;
    fieldErrors?: Record<string, string>;
    details?: Record<string, unknown>;
  };
  try {
    response = await fetch(request.url, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.body),
    });
    data = await response.json().catch(() => ({}));
  } catch {
    throw new SaveError("Network error", "generic");
  }

  if (!response.ok || !data.success) {
    const code = response.status === 429 ? "rate_limited" : data.code || (response.status === 403 ? "forbidden" : "generic");
    throw new SaveError(data.error || "Save failed", code, data.fieldErrors ?? {}, data.details);
  }

  const result = data.data ?? {};
  if (result.pendingReview) {
    return { kind: "pending", approvalId: String((result.approval as { id?: string } | undefined)?.id ?? "") };
  }
  if (mode === "create") return { kind: "created", entityId: String(result.id), entity: result };
  if (mode === "edit") return { kind: "saved", entity: result };
  return { kind: "proposalSaved", approval: result };
}
