"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Honeypot, honeypotValue } from "@/components/ui/Honeypot";

export default function ContactPage() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const homepage = honeypotValue(e.currentTarget);
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, locale, homepage }),
      });
      if (!response.ok) {
        throw new Error(response.status === 429 ? t("tooMany") : t("sendFailed"));
      }

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sendFailed"));
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
            <form onSubmit={handleSubmit} className="space-y-6 relative">
              {error && (
                <div className="p-3 bg-error-50 border border-error-200 text-error-700 rounded-lg text-sm">
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

              <Select
                name="subject"
                label={`${t("subject")} *`}
                value={formData.subject}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">{t("selectSubject")}</option>
                <option value="general">{t("generalInquiry")}</option>
                <option value="listing">{t("aboutMyListing")}</option>
                <option value="support">{t("technicalSupport")}</option>
                <option value="suggestion">{t("suggestion")}</option>
                <option value="other">{t("other")}</option>
              </Select>

              <Textarea
                name="message"
                label={`${t("message")} *`}
                value={formData.message}
                onChange={handleChange}
                required
                disabled={loading}
                rows={6}
                maxLength={5000}
                placeholder={t("messagePlaceholder")}
              />

              <Honeypot />

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t("sending") : t("sendMessage")}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                {t("termsAgreement")}{" "}
                <Link href="/terms" className="text-primary-600 hover:text-primary-800">
                  {t("termsLink")}
                </Link>{" "}
                {t("and")}{" "}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-800">
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

