"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/shared";

export default function SignIn() {
  const t = useTranslations("auth");
  return (
    <AuthShell title={t("signIn")}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
