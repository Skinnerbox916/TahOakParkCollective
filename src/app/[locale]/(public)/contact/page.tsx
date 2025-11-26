"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ContactPage() {
  const t = useTranslations("contact");
  const tErrors = useTranslations("errors");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // For now, we'll just show a success message
      // In the future, this could send an email via API
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors("generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("title")}</h1>
          <p className="text-xl text-gray-600">
            {t("subtitle")}
          </p>
        </div>

        <Card className="p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("messageSent")}</h2>
              <p className="text-gray-600 mb-6">
                {t("thankYou")}
              </p>
              <Button
                onClick={() => {
                  setSuccess(false);
                  setFormData({
                    name: "",
                    email: "",
                    subject: "",
                    message: "",
                  });
                }}
                variant="outline"
              >
                {t("sendAnother")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  type="text"
                  name="name"
                  label={`${t("yourName")} *`}
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="John Doe"
                />

                <Input
                  type="email"
                  name="email"
                  label={`${t("emailAddress")} *`}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("subject")} *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">{t("selectSubject")}</option>
                  <option value="general">{t("generalInquiry")}</option>
                  <option value="support">{t("technicalSupport")}</option>
                  <option value="suggestion">{t("suggestion")}</option>
                  <option value="claim">{t("entityClaim")}</option>
                  <option value="other">{t("other")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("message")} *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t("messagePlaceholder")}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t("sending") : t("sendMessage")}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                {t("termsAgreement")}{" "}
                <Link href="/terms" className="text-indigo-600 hover:text-indigo-800">
                  {t("termsLink")}
                </Link>{" "}
                {t("and")}{" "}
                <Link href="/privacy" className="text-indigo-600 hover:text-indigo-800">
                  {t("privacyLink")}
                </Link>
                .
              </p>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}

