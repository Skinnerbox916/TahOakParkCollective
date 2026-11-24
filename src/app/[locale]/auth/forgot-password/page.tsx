"use client";

import { useTranslations } from "next-intl";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthShell } from "@/components/auth/shared";

export default function ForgotPassword() {
  const t = useTranslations("auth");
  return (
    <AuthShell title={t("forgotTitle")}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
