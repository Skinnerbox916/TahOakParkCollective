"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("title")}</h1>
          <p className="text-xl text-gray-600">
            {t("subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          {/* Mission Section */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("mission")}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t("missionText1")}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t("missionText2")}
            </p>
          </Card>

          {/* Inclusion Criteria */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("inclusionCriteria")}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t("inclusionText")}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
              <li>
                <strong>{t("presence")}</strong> {t("presenceText")}
              </li>
              <li>
                <strong>{t("contribution")}</strong> {t("contributionText")}
              </li>
              <li>
                <strong>{t("standards")}</strong> {t("standardsText")}
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              <strong>{t("exclude")}</strong> {t("excludeText")}
            </p>
          </Card>

          {/* Credits */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("credits")}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t("creditsText1")}{" "}
              <a
                href="https://canopydigital.services"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Canopy Digital Services
              </a>{" "}
              {t("creditsText2")}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t("creditsText3")}
            </p>
          </Card>

          {/* Contact Section */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("feedback")}</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              {t("feedbackText")}
            </p>
            <Link href="/contact">
              <Button className="w-full sm:w-auto">
                {t("contactUs")}
              </Button>
            </Link>
          </Card>
        </div>
      </main>
    </div>
  );
}

