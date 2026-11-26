"use client";

import { useTranslations } from "next-intl";
import { useEntityTypeLabels } from "@/lib/entityTypeTranslations";
import { HoursDisplay } from "@/components/entity/HoursDisplay";
import type { ListingValues } from "./values";

/** A read-only view of a listing's values: what a reviewer approves. */
export function ListingSummary({
  values,
  categoryNames,
  tagNames,
}: {
  values: ListingValues;
  categoryNames: Record<string, string>;
  tagNames: Record<string, string>;
}) {
  const t = useTranslations("listingEditor");
  const typeLabels = useEntityTypeLabels();
  const none = t("summary.none");
  const social = Object.entries(values.socialMedia).filter(([, url]) => url);

  const rows: [string, React.ReactNode][] = [
    [t("fields.name"), values.name || none],
    [t("fields.nameEs"), values.nameEs || none],
    [t("fields.entityType"), typeLabels[values.entityType] ?? values.entityType],
    [t("fields.categories"), values.categorySlugs.map((s) => categoryNames[s] ?? s).join(", ") || none],
    [t("fields.description"), values.description || none],
    [t("fields.descriptionEs"), values.descriptionEs || none],
    [t("fields.address"), values.address || none],
    [t("fields.phone"), values.phone || none],
    [t("fields.website"), values.website || none],
    [
      t("sections.online"),
      social.length === 0
        ? none
        : social.map(([platform, url]) => (
            <span key={platform} className="block">
              {platform}: {url}
            </span>
          )),
    ],
    [t("sections.tags"), values.tagSlugs.map((s) => tagNames[s] ?? s).join(", ") || none],
  ];

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 sm:grid-cols-[12rem_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-medium text-gray-500">{label}</dt>
            <dd className="text-gray-900 whitespace-pre-wrap break-words">{value}</dd>
          </div>
        ))}
      </dl>
      {Object.keys(values.hours).length > 0 && <HoursDisplay hours={values.hours} />}
    </div>
  );
}
