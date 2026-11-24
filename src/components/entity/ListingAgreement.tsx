"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const POINTS = ["represent", "display", "identity", "unpublish"] as const;

/** What an owner agrees to when they publish a listing, with the box they tick. */
export function ListingAgreement({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("listingAgreement");
  return (
    <div className="text-sm text-gray-700">
      <p className="mb-2">{t("intro")}</p>
      <ul className="list-disc pl-5 space-y-1 mb-4">
        {POINTS.map((point) => (
          <li key={point}>{t(point)}</li>
        ))}
      </ul>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus-ring"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          {t.rich("agree", {
            terms: (chunks) => (
              <Link href="/terms" target="_blank" className="text-primary-600 underline">
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>
    </div>
  );
}
