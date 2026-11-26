import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { lookupShareLink } from "@/lib/entities";
import { entityIncludePublic, transformEntity } from "@/lib/entity-helpers";
import { ENTITY_STATUS } from "@/lib/prismaEnums";
import { consume, HOUR } from "@/lib/rate-limit";
import { EntityDetail } from "@/components/entity/EntityDetail";
import { PreviewActions } from "@/components/entity/PreviewActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { EntityWithRelations } from "@/types";

type Params = { params: Promise<{ locale: string; token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "preview" });
  // Private: never indexed, and the token never leaks through a Referer.
  return { title: t("metaTitle"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

/**
 * A draft listing shared with its owner (src/lib/entities/share-links.ts).
 * It shows the listing as it would appear, and lets the owner publish it.
 */
export default async function PreviewPage({ params }: Params) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("preview");

  const h = await headers();
  const ip = h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const allowed = consume(`share-preview:ip:${ip}`, 60, HOUR).ok;
  const link = allowed ? await lookupShareLink(token) : null;

  if (!link || link.state !== "open") {
    const user = link?.state === "used" ? await getCurrentUser() : null;
    const usedByYou = !!user && user.id === link?.usedById;
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <Card>
          <p className="text-gray-900 font-medium mb-2">
            {usedByYou ? t("usedByYou") : t(link ? link.state : "invalid")}
          </p>
          {usedByYou ? (
            <Button href="/portal/dashboard" className="mt-2">
              {t("goToDashboard")}
            </Button>
          ) : (
            <p className="text-gray-600">{t("askForNew")}</p>
          )}
        </Card>
      </div>
    );
  }

  const entity = await prisma.entity.findUnique({ where: { id: link.entityId }, include: entityIncludePublic });
  if (!entity) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <Card>
          <p className="text-gray-900 font-medium mb-2">{t("invalid")}</p>
          <p className="text-gray-600">{t("askForNew")}</p>
        </Card>
      </div>
    );
  }
  const listing = transformEntity(entity, locale) as EntityWithRelations;
  // Already public when an admin published it for an owner who now wants an account.
  const live = entity.status === ENTITY_STATUS.ACTIVE;

  return (
    <div>
      <div className="bg-warning-50 border-b border-warning-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="font-semibold text-gray-900">{t(live ? "bannerTitleLive" : "bannerTitle")}</p>
          <p className="text-sm text-gray-700">{t(live ? "bannerTextLive" : "bannerText")}</p>
          <a href="#publish" className="mt-2 inline-block text-sm font-medium text-primary-700 underline">
            {t(live ? "jumpToTakeOver" : "jumpToPublish")}
          </a>
        </div>
      </div>
      {/* No "report an issue": the report page can't open a private draft. */}
      <EntityDetail entity={listing} hideSections={["report"]} />
      <div id="publish" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 scroll-mt-20">
        <PreviewActions token={token} slug={entity.slug} alreadyPublished={live} />
      </div>
    </div>
  );
}
