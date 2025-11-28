"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { Dropdown } from '@/components/ui/Dropdown';

const localeLabels: Record<string, string> = {
  en: 'English',
  es: 'Español',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Dropdown
      trigger={
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Select language"
        >
          <span>{locale.toUpperCase()}</span>
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      }
      align="right"
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
            locale === loc
              ? 'bg-indigo-50 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          aria-label={`Switch to ${localeLabels[loc]}`}
        >
          <div className="flex items-center justify-between">
            <span>{localeLabels[loc]}</span>
            {locale === loc && (
              <svg
                className="w-4 h-4 text-indigo-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </button>
      ))}
    </Dropdown>
  );
}

