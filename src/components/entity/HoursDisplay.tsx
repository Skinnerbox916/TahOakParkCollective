"use client";

import { useLocale, useTranslations } from "next-intl";
import { WEEKDAYS, weekdayName } from "@/lib/weekdays";

interface HoursDisplayProps {
  hours: Record<string, { open?: string; close?: string; closed?: boolean }>;
}

export function HoursDisplay({ hours }: HoursDisplayProps) {
  const t = useTranslations("hours");
  const locale = useLocale();
  if (!hours || Object.keys(hours).length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("title")}</h2>
      <div className="space-y-2">
        {WEEKDAYS.map((day, index) => {
          const dayHours = hours[day];
          if (!dayHours) return null;

          const isClosed = dayHours.closed === true;
          const hasHours = dayHours.open && dayHours.close;

          return (
            <div
              key={day}
              className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0"
            >
              <span className="text-sm font-medium text-gray-700">{weekdayName(locale, index)}</span>
              <span className="text-sm text-gray-600">
                {isClosed ? t("closed") : hasHours ? `${dayHours.open} – ${dayHours.close}` : t("notSpecified")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
