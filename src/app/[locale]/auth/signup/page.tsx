"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthShell } from "@/components/auth/shared";

export default function SignUp() {
  const t = useTranslations("auth");
  return (
    <AuthShell title={t("createAccount")}>
      <p className="text-gray-600 text-center -mt-3 mb-6">{t("joinCollective")}</p>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
