"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");
  const tErrors = useTranslations("errors");

  const validateForm = () => {
    if (!email || !password) {
      setError(tForms("validation.emailRequired"));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(tForms("validation.invalidEmail"));
      return false;
    }

    if (password.length < 8) {
      setError(tForms("validation.passwordMinLength"));
      return false;
    }

    if (password !== confirmPassword) {
      setError(tForms("validation.passwordsDoNotMatch"));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || tErrors("generic"));
        setLoading(false);
        return;
      }

      // Registration successful - redirect to sign in
      router.push("/auth/signin?registered=true");
    } catch (err) {
      console.error("Registration error:", err);
      setError(t("errorOccurred"));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Input
        type="text"
        label={tForms("nameOptional")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
      />

      <Input
        type="email"
        label={tCommon("email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
      />

      <Input
        type="password"
        label={tCommon("password")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
        minLength={8}
      />

      <Input
        type="password"
        label={tForms("confirmPassword")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={loading}
        minLength={8}
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("creatingAccount") : t("createAccount")}
      </Button>

      <div className="text-center text-sm text-gray-600">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/auth/signin" className="text-indigo-600 hover:text-indigo-700 font-medium">
          {t("signInLink")}
        </Link>
      </div>
    </form>
  );
}

