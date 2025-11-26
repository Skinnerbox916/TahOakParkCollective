"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function PrivacyPage() {
  const t = useTranslations("privacy");
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
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("introduction")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("introductionText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("informationWeCollect")}</h2>
            <h3 className="text-lg font-medium text-gray-800 mb-2">{t("informationYouProvide")}</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 mb-3">
              <li><strong>{t("accountInfo")}</strong> {t("accountInfoText")}</li>
              <li><strong>{t("entityInfo")}</strong> {t("entityInfoText")}</li>
              <li><strong>{t("contactInfo")}</strong> {t("contactInfoText")}</li>
              <li><strong>{t("content")}</strong> {t("contentText")}</li>
            </ul>
            <h3 className="text-lg font-medium text-gray-800 mb-2">{t("automaticallyCollected")}</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>{t("automaticallyCollectedText")}</li>
              <li>{t("usageData")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("howWeUse")}</h2>
            <p className="text-gray-700 leading-relaxed mb-2">{t("howWeUseText")}</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>{t("providePlatform")}</li>
              <li>{t("processAccount")}</li>
              <li>{t("sendUpdates")}</li>
              <li>{t("respond")}</li>
              <li>{t("protect")}</li>
              <li>{t("comply")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("emailCommunications")}</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>{t("subscriptions")}</strong> {t("subscriptionsText")}
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>{t("transactional")}</strong> {t("transactionalText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("analytics")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("analyticsText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("informationSharing")}</h2>
            <p className="text-gray-700 leading-relaxed mb-2">{t("informationSharingText")}</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>{t("serviceProviders")}</li>
              <li>{t("requiredByLaw")}</li>
              <li>{t("publicInfo")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("dataSecurity")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("dataSecurityText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("yourRights")}</h2>
            <p className="text-gray-700 leading-relaxed mb-2">{t("yourRightsText")}</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>{t("access")}</li>
              <li>{t("delete")}</li>
              <li>{t("unsubscribe")}</li>
              <li>{t("requestInfo")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("childrensPrivacy")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("childrensPrivacyText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("changes")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("changesText")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("contactUs")}</h2>
            <p className="text-gray-700 leading-relaxed">
              {t("contactUsText")}{" "}
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

