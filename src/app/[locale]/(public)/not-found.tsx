import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{t("notFoundTitle")}</h1>
      <p className="text-gray-600 mb-8">{t("notFoundText")}</p>
      <Button href="/">{t("backHome")}</Button>
    </div>
  );
}
