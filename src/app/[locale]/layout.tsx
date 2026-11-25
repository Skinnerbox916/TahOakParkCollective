import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "../globals.css";

// Site-wide body typeface. To change it, swap the loader here; everything
// else reads the semantic --font-body variable.
const bodyFont = Roboto({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("title"), description: t("description") };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * The root layout (there is no app/layout.tsx): every page lives under
 * [locale], so <html lang> can come from the URL and pages stay static.
 * Navigation is handled by route-group-specific layouts:
 * - (public) routes use PublicNavbar + Footer
 * - (admin) routes use DashboardShell
 * - (portal) routes use DashboardShell
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    // Font variables must live on <html>: Tailwind resolves --font-sans on :root,
    // so variables scoped to <body> are undefined there and fall back to system fonts.
    <html lang={locale} suppressHydrationWarning className={`${bodyFont.variable} ${geistMono.variable}`}>
      <body className="antialiased flex flex-col min-h-screen">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
