"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function TermsPage() {
  const t = useTranslations("terms");
  const currentDate = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("title")}</h1>
          <p className="text-sm text-gray-500">{t("lastUpdated", { date: currentDate })}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("acceptance")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("acceptanceText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("useLicense")}</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {t("useLicenseText1")}
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>{t("modify")}</li>
              <li>{t("commercialUse")}</li>
              <li>{t("reverseEngineer")}</li>
              <li>{t("removeCopyright")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("imageLicensing")}</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>{t("imageLicensingText1")}</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>{t("displayImages")}</li>
              <li>{t("promotionalUse")}</li>
              <li>{t("replaceImages")}</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              {t("imageLicensingText2")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("userContent")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("userContentText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("disclaimer")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("disclaimerText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("limitations")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("limitationsText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("accuracy")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("accuracyText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("modifications")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("modificationsText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("contact")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("contactText")}{" "}
              <Link href="/contact" className="text-indigo-600 hover:text-indigo-800 font-medium">
                {t("contactLink")}
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

