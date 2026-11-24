"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { StepUp } from "@/components/auth/StepUp";
import { AuthShell } from "@/components/auth/shared";

export default function StepUpPage() {
  const t = useTranslations("auth");
  return (
    <AuthShell title={t("stepUpTitle")}>
      <Suspense>
        <StepUp />
      </Suspense>
    </AuthShell>
  );
}
