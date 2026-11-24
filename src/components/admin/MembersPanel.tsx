"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAdminTranslations } from "@/lib/admin-translations";
import type { ApiResponse } from "@/types";

interface Member {
  role: "OWNER" | "MANAGER";
  user: { id: string; name: string | null; email: string | null };
}

/** Admin: who manages a listing. A listing with no members is unclaimed. */
export function MembersPanel({ entityId }: { entityId: string }) {
  const { t } = useAdminTranslations("entities");
  const [members, setMembers] = useState<Member[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"OWNER" | "MANAGER">("OWNER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(method: "GET" | "POST" | "DELETE", query = "", body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/entities/${entityId}/members${query}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data: ApiResponse<Member[]> = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t("members.error"));
      setMembers(data.data ?? []);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("members.error"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    call("GET");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">{t("members.title")}</h2>
      <p className="text-sm text-gray-500 mb-4">{t("members.description")}</p>

      {error && <p className="mb-3 text-sm text-error-600">{error}</p>}

      {members === null ? null : members.length === 0 ? (
        <p className="text-sm text-gray-600 mb-4">{t("members.empty")}</p>
      ) : (
        <ul className="divide-y divide-gray-100 mb-4">
          {members.map((m) => (
            <li key={m.user.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                <span className="text-gray-900">{m.user.name || m.user.email}</span>
                {m.user.name && <span className="text-gray-500"> · {m.user.email}</span>}
                <span className="ml-2 text-xs uppercase text-gray-500">{t(`members.roles.${m.role}`)}</span>
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (confirm(t("members.removeConfirm", { name: m.user.name || m.user.email || "" }))) {
                    call("DELETE", `?userId=${encodeURIComponent(m.user.id)}`);
                  }
                }}
                className="text-error-600 hover:text-error-800 disabled:opacity-50"
              >
                {t("members.remove")}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-col sm:flex-row gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await call("POST", "", { email, role })) setEmail("");
        }}
      >
        <div className="flex-1">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("members.emailPlaceholder")}
            disabled={busy}
            required
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "OWNER" | "MANAGER")}
          disabled={busy}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="OWNER">{t("members.roles.OWNER")}</option>
          <option value="MANAGER">{t("members.roles.MANAGER")}</option>
        </select>
        <Button type="submit" disabled={busy || !email.trim()}>
          {t("members.add")}
        </Button>
      </form>
    </Card>
  );
}
