"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormSection } from "@/components/ui/FormSection";
import { BusinessHoursInput } from "@/components/form/BusinessHoursInput";
import { useEntityTypeLabels } from "@/lib/entityTypeTranslations";
import { getFormConfig, type SocialPlatform } from "@/lib/entityFormConfig";
import { requiresConsent } from "@/lib/entities/policy";
import { validateEntityInput } from "@/lib/schemas/entitySchema";
import { ENTITY_STATUS, ENTITY_TYPE, TagCategory, type EntityStatus, type EntityType } from "@/lib/prismaEnums";
import { saveListing, SaveError, type SaveResult } from "./saveListing";
import {
  emptyValues,
  toPayload,
  visibleSocial,
  type DisplayField,
  type EditorMode,
  type EditorRole,
  type ListingValues,
} from "./values";

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  yelp: "Yelp",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
};
const TAG_GROUPS = [TagCategory.IDENTITY, TagCategory.FRIENDLINESS, TagCategory.AMENITY] as const;

interface CategoryOption {
  slug: string;
  name: string;
  entityTypes: string[];
}
interface TagOption {
  slug: string;
  name: string;
  category: string;
}
interface UserOption {
  id: string;
  name: string;
  email: string;
}

/** "Show on profile" under a field: the field's displaySettings switch. */
function ShowToggle({ checked, onChange, label }: { checked: boolean; onChange: (shown: boolean) => void; label: string }) {
  return (
    <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus-ring"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export interface ListingEditorProps {
  mode: EditorMode;
  role: EditorRole;
  /** Starting values (edit and review); omitted for a new listing. */
  initial?: ListingValues;
  entityId?: string;
  approvalId?: string;
  /** The version the form loaded (edit), so a stale save is refused. */
  version?: number;
  /** Edit: whether the listing has a map pin, and its owner's agreement (for the status note). */
  hasMapPin?: boolean;
  consented?: boolean;
  onSaved?: (result: SaveResult) => void;
  onCancel?: () => void;
}

/**
 * The one listing form: admins and owners, creating, editing, or (admins)
 * editing a pending proposal. Every save goes through src/lib/entities, which
 * decides what applies now and what waits for review.
 */
export function ListingEditor({
  mode,
  role,
  initial,
  entityId,
  approvalId,
  version,
  hasMapPin = false,
  consented = false,
  onSaved,
  onCancel,
}: ListingEditorProps) {
  const t = useTranslations("listingEditor");
  const locale = useLocale();
  const typeLabels = useEntityTypeLabels();
  const start = useMemo(() => initial ?? emptyValues(), [initial]);
  const [values, setValues] = useState<ListingValues>(start);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[] | null>(null);
  const [tags, setTags] = useState<TagOption[] | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = <T,>(url: string, set: (rows: T) => void) =>
      fetch(url)
        .then((res) => res.json())
        .then((data) => !cancelled && data.success && set(data.data))
        .catch(() => {});
    load<CategoryOption[]>(`/api/categories?locale=${locale}`, setCategories);
    load<TagOption[]>(`/api/tags?locale=${locale}`, setTags);
    if (role === "admin" && mode === "create") load<UserOption[]>("/api/admin/users", setUsers);
    return () => {
      cancelled = true;
    };
  }, [locale, role, mode]);

  const config = getFormConfig(values.entityType);
  const hoursConfig = config.sections.hours;
  const platforms = config.socialPlatforms;
  const needsOwner = requiresConsent(values.entityType);
  const statusEditable = role === "admin" && mode !== "review" && !needsOwner;
  const fitting = (categories ?? []).filter((c) => c.entityTypes.includes(values.entityType));

  const set = <K extends keyof ListingValues>(key: K, value: ListingValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const toggle = (key: "categorySlugs" | "tagSlugs", slug: string) =>
    setValues((v) => ({
      ...v,
      [key]: v[key].includes(slug) ? v[key].filter((s) => s !== slug) : [...v[key], slug].sort(),
    }));
  const setShown = (field: DisplayField, shown: boolean) =>
    setValues((v) => ({ ...v, display: { ...v.display, [field]: shown } }));

  function changeType(entityType: EntityType) {
    // Keep only the categories that still fit the new type.
    const allowed = new Set((categories ?? []).filter((c) => c.entityTypes.includes(entityType)).map((c) => c.slug));
    setValues((v) => ({ ...v, entityType, categorySlugs: v.categorySlugs.filter((s) => allowed.has(s)) }));
  }

  /** A message key from the schema or the server ("validation.invalidPhone"), in the page's language. */
  function message(key: string, field?: string): string {
    const platform = field?.startsWith("socialMedia.") ? SOCIAL_LABELS[field.split(".")[1] as SocialPlatform] : undefined;
    if (t.has(key)) return t(key, { platform: platform ?? "" });
    return t("errors.generic");
  }

  function showFieldErrors(errors: Record<string, string>) {
    setFieldErrors(Object.fromEntries(Object.entries(errors).map(([field, key]) => [field, message(key, field)])));
    const first = Object.keys(errors)[0];
    if (first) {
      const target = document.querySelector(`[data-field="${first.split(".")[0]}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setFieldErrors({});

    const checked = validateEntityInput({
      name: values.name,
      description: values.description,
      address: values.address,
      phone: values.phone,
      website: values.website,
      socialMedia: visibleSocial(values.socialMedia, platforms),
      hours: hoursConfig.enabled ? values.hours : undefined,
    });
    const errors: Record<string, string> = checked.success ? {} : { ...checked.fieldErrors };
    if (values.categorySlugs.length === 0) errors.categorySlugs = "validation.categoryRequired";
    if (Object.keys(errors).length > 0) {
      showFieldErrors(errors);
      setError(t("errors.fixErrors"));
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload(values, start, {
        mode,
        role,
        platforms,
        hoursEnabled: hoursConfig.enabled,
        statusEditable,
      });
      const result = await saveListing({ mode, payload, entityId, approvalId, version });
      if (result.kind === "pending") setNotice(t(mode === "create" ? "notices.submittedForReview" : "notices.editsSubmitted"));
      else if (result.kind === "created") setNotice(t(needsOwner ? "notices.draftCreated" : "notices.created"));
      else if (result.kind === "saved") setNotice(t("notices.saved"));
      else setNotice(t("notices.proposalSaved"));
      onSaved?.(result);
    } catch (err) {
      if (err instanceof SaveError) {
        if (Object.keys(err.fieldErrors).length > 0) {
          showFieldErrors(err.fieldErrors);
          setError(t("errors.fixErrors"));
        } else {
          setError(t.has(`errors.${err.code}`) ? t(`errors.${err.code}`) : t("errors.generic"));
        }
      } else {
        setError(t("errors.generic"));
      }
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (field: string) => fieldErrors[field];
  const toggleProps = (field: DisplayField) => ({
    checked: values.display[field],
    onChange: (shown: boolean) => setShown(field, shown),
    label: t("hints.showOnProfile"),
  });

  const submitLabel =
    mode === "review"
      ? t("buttons.saveProposal")
      : role === "owner"
        ? t("buttons.submit")
        : mode === "create"
          ? t("buttons.create")
          : t("buttons.save");

  // Identity tags (Black-owned, ...) are the owner's to add; others only see the ones already there.
  const initialTags = new Set(start.tagSlugs);
  const tagShown = (tag: TagOption) =>
    tag.category !== TagCategory.IDENTITY || role === "owner" || initialTags.has(tag.slug);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Basics */}
      <FormSection title={t("sections.basics")} defaultExpanded collapsible={false}>
        <div className="space-y-4">
          <div data-field="name">
            <Input
              label={`${t("fields.name")} *`}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t("placeholders.name")}
              error={fieldError("name")}
              required
            />
          </div>
          <div data-field="entityType">
            <Select
              label={t("fields.entityType")}
              value={values.entityType}
              onChange={(e) => changeType(e.target.value as EntityType)}
            >
              {Object.values(ENTITY_TYPE).map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </Select>
          </div>
          <fieldset data-field="categorySlugs">
            <legend className="block text-sm font-medium text-gray-700 mb-1">{t("fields.categories")} *</legend>
            <p className="text-xs text-gray-500 mb-2">{t("hints.categories")}</p>
            {categories && fitting.length === 0 && <p className="text-sm text-gray-500">{t("hints.noCategories")}</p>}
            <div className="flex flex-wrap gap-2">
              {fitting.map((cat) => (
                <label
                  key={cat.slug}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer ${
                    values.categorySlugs.includes(cat.slug)
                      ? "border-primary-400 bg-primary-50 text-primary-800"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={values.categorySlugs.includes(cat.slug)}
                    onChange={() => toggle("categorySlugs", cat.slug)}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
            {fieldError("categorySlugs") && <p className="mt-1 text-sm text-error-600">{fieldError("categorySlugs")}</p>}
          </fieldset>
        </div>
      </FormSection>

      {/* About */}
      <FormSection title={t("sections.about")} defaultExpanded>
        <div className="space-y-4">
          <div data-field="description">
            <Textarea
              label={t("fields.description")}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t("placeholders.description")}
              rows={4}
              error={fieldError("description")}
            />
          </div>
          <Input
            label={t("fields.nameEs")}
            value={values.nameEs}
            onChange={(e) => set("nameEs", e.target.value)}
          />
          <p className="-mt-3 text-xs text-gray-500">{t("hints.nameEs")}</p>
          <Textarea
            label={t("fields.descriptionEs")}
            value={values.descriptionEs}
            onChange={(e) => set("descriptionEs", e.target.value)}
            placeholder={t("placeholders.descriptionEs")}
            rows={4}
          />
          <p className="-mt-3 text-xs text-gray-500">{t("hints.descriptionEs")}</p>
        </div>
      </FormSection>

      {/* Location and contact */}
      <FormSection
        title={t("sections.locationContact")}
        description={t(`hints.address.${values.entityType}`)}
        defaultExpanded
      >
        <div className="space-y-4">
          <div data-field="address">
            <Input
              label={t("fields.address")}
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder={t("placeholders.address")}
              error={fieldError("address")}
            />
            <ShowToggle {...toggleProps("address")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div data-field="phone">
              <Input
                type="tel"
                label={t("fields.phone")}
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder={t("placeholders.phone")}
                error={fieldError("phone")}
              />
              <ShowToggle {...toggleProps("phone")} />
            </div>
            <div data-field="website">
              <Input
                type="url"
                label={t("fields.website")}
                value={values.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder={t("placeholders.website")}
                error={fieldError("website")}
              />
              <ShowToggle {...toggleProps("website")} />
            </div>
          </div>
          {mode === "edit" &&
            (hasMapPin ? (
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus-ring"
                  checked={values.display.location}
                  onChange={(e) => setShown("location", e.target.checked)}
                />
                {t("hints.mapPin")}
              </label>
            ) : (
              <p className="text-xs text-gray-500">{t("hints.noMapPin")}</p>
            ))}
        </div>
      </FormSection>

      {/* Hours */}
      {hoursConfig.enabled && (
        <FormSection
          title={t(`sections.${hoursConfig.titleKey}`)}
          description={hoursConfig.descriptionKey ? t(`sections.${hoursConfig.descriptionKey}`) : undefined}
          defaultExpanded={Object.keys(values.hours).length > 0}
          hasData={Object.keys(values.hours).length > 0}
        >
          <div data-field="hours">
            <BusinessHoursInput value={values.hours} onChange={(hours) => set("hours", hours)} />
            {Object.entries(fieldErrors)
              .filter(([field]) => field.startsWith("hours"))
              .slice(0, 1)
              .map(([field, msg]) => (
                <p key={field} className="mt-1 text-sm text-error-600">
                  {msg}
                </p>
              ))}
            <ShowToggle {...toggleProps("hours")} />
          </div>
        </FormSection>
      )}

      {/* Online */}
      <FormSection
        title={t("sections.online")}
        defaultExpanded={platforms.some((p) => values.socialMedia[p])}
        hasData={platforms.some((p) => values.socialMedia[p])}
      >
        <div data-field="socialMedia" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {platforms.map((platform) => (
            <Input
              key={platform}
              type="url"
              label={SOCIAL_LABELS[platform]}
              value={values.socialMedia[platform] ?? ""}
              onChange={(e) => set("socialMedia", { ...values.socialMedia, [platform]: e.target.value })}
              placeholder={t("placeholders.social")}
              error={fieldError(`socialMedia.${platform}`)}
            />
          ))}
        </div>
        <ShowToggle {...toggleProps("socialMedia")} />
      </FormSection>

      {/* Tags */}
      <FormSection
        title={t("sections.tags")}
        description={t("sections.tagsDescription")}
        defaultExpanded={values.tagSlugs.length > 0}
        hasData={values.tagSlugs.length > 0}
      >
        <div data-field="tagSlugs" className="space-y-3">
          {TAG_GROUPS.map((group) => {
            const groupTags = (tags ?? []).filter((tag) => tag.category === group && tagShown(tag));
            if (groupTags.length === 0) return null;
            return (
              <div key={group}>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {t(`tagGroups.${group}`)}
                  {group === TagCategory.IDENTITY && role !== "owner" && (
                    <span className="font-normal"> · {t("hints.identityOwnerOnly")}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {groupTags.map((tag) => (
                    <label
                      key={tag.slug}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer border ${
                        values.tagSlugs.includes(tag.slug)
                          ? "bg-success-100 border-success-300 text-success-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={values.tagSlugs.includes(tag.slug)}
                        onChange={() => toggle("tagSlugs", tag.slug)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          {fieldError("tagSlugs") && <p className="text-sm text-error-600">{fieldError("tagSlugs")}</p>}
        </div>
      </FormSection>

      {/* Admin */}
      {role === "admin" && mode !== "review" && (
        <FormSection title={t("sections.admin")} defaultExpanded collapsible={false}>
          <div className="space-y-4">
            {statusEditable ? (
              <Select
                label={t("fields.status")}
                value={values.status}
                onChange={(e) => set("status", e.target.value as EntityStatus)}
              >
                <option value={ENTITY_STATUS.ACTIVE}>{t("status.ACTIVE")}</option>
                <option value={ENTITY_STATUS.INACTIVE}>{t("status.INACTIVE")}</option>
              </Select>
            ) : (
              <p className="text-sm text-gray-600">
                {mode === "edit" && consented && values.status === ENTITY_STATUS.ACTIVE
                  ? t("hints.publishedNote")
                  : t("hints.draftNote")}
              </p>
            )}
            {mode === "create" && (
              <Select label={t("fields.owner")} value={values.ownerId} onChange={(e) => set("ownerId", e.target.value)}>
                <option value="">{t("hints.noOwner")}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ? `${user.name} · ${user.email}` : user.email}
                  </option>
                ))}
              </Select>
            )}
            {mode === "edit" && (
              <div data-field="slug">
                <Input
                  label={t("fields.slug")}
                  value={values.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  error={fieldError("slug")}
                />
                <p className="mt-1 text-xs text-gray-500">{t("hints.slug")}</p>
              </div>
            )}
          </div>
        </FormSection>
      )}

      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button type="submit" disabled={saving} className="sm:flex-1">
          {saving ? t("buttons.saving") : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            {t("buttons.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
