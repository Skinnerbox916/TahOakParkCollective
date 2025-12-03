"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAdminTranslations } from "@/lib/admin-translations";

export default function QuickAddPage() {
  const [entityName, setEntityName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useAdminTranslations("quickAdd");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/ai-add-entity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityName: entityName.trim(),
        }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Response is not JSON (likely HTML error page)
        const text = await response.text();
        let errorMessage = "Server error occurred";
        
        if (response.status === 401) {
          errorMessage = "Unauthorized. Please log in again.";
        } else if (response.status === 403) {
          errorMessage = "Access denied. You don't have permission to perform this action.";
        } else if (response.status === 500) {
          // Try to extract error message from HTML if possible
          const errorMatch = text.match(/"message":"([^"]+)"/);
          if (errorMatch) {
            errorMessage = `Server error: ${errorMatch[1]}`;
          } else {
            errorMessage = "Server error. Please check your configuration and try again.";
          }
        } else {
          errorMessage = `Error (${response.status}). Please try again.`;
        }
        
        throw new Error(errorMessage);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to add entity");
      }

      setSuccess(data.message || `Entity "${entityName}" added successfully! Status: Pending`);
      setEntityName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title={t("title")}
        description={t("description")}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="entityName"
            type="text"
            label={t("entityName")}
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            placeholder={t("placeholder")}
            required
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            {t("hint")}
          </p>

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              {success}
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading || !entityName.trim()}
            className="w-full"
          >
            {loading ? t("researching") : t("addEntity")}
          </Button>
        </form>
      </Card>

      <Alert variant="info">
        <h3 className="text-sm font-semibold mb-2">{t("howItWorks")}</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>{t("step1")}</li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
          <li>{t("step4")}</li>
        </ul>
      </Alert>
    </div>
  );
}
