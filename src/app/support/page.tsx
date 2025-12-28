"use client";

import { useState } from "react";
import { useT } from "@/lib/translation";
import Button from "@/components/ui/button";

type Status = "idle" | "sending" | "success" | "error";

export default function SupportPage() {
  const { t, lang } = useT();

  const [category, setCategory] = useState<"support" | "feedback">("support");
  const [role, setRole] = useState<"visitor" | "earner" | "employer">("visitor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // honeypot
  const [website, setWebsite] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCategory("support");
    setRole("visitor");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setWebsite("");
    setStatus("idle");
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // простые проверки на клиенте
    if (!email.trim()) {
      setError(t("support_error_email_required"));
      return;
    }
    if (!subject.trim()) {
      setError(t("support_error_subject_required"));
      return;
    }
    if (message.trim().length < 10) {
      setError(t("support_error_message_too_short"));
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          role,
          name: name.trim() || null,
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          website, // honeypot
          lang,
          page_url: typeof window !== "undefined" ? window.location.href : null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // fallback
        setError(t("support_error_unknown"));
        setStatus("error");
        return;
      }

      if (data?.ok) {
        setStatus("success");
        return;
      }

      setError(t("support_error_unknown"));
      setStatus("error");
    } catch (err) {
      setError(t("support_error_unknown"));
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg p-6 space-y-6">
        <h1 className="text-xl font-semibold">{t("support_title")}</h1>
        <p className="text-sm text-slate-600">{t("support_subtitle")}</p>

        {status === "success" ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
            <p className="text-sm text-green-800 font-medium">{t("support_success_title")}</p>
            <p className="text-sm text-slate-700">{t("support_success_text")}</p>

            <Button variant="green" onClick={reset} className="w-full">
              {t("support_send_another")}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("support_category")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="support">{t("support_category_support")}</option>
                <option value="feedback">{t("support_category_feedback")}</option>
              </select>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("support_role")}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="visitor">{t("support_role_visitor")}</option>
                <option value="earner">{t("support_role_earner")}</option>
                <option value="employer">{t("support_role_employer")}</option>
              </select>
            </div>

            {/* Name (optional) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("support_name")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">{t("support_name_hint")}</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("support_email")}
              </label>
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("support_subject")}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("support_message")}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">{t("support_message_hint")}</p>
            </div>

            {/* Honeypot hidden */}
            <div className="hidden">
              <label>Website</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="green"
              disabled={status === "sending"}
              className="w-full"
            >
              {status === "sending" ? t("support_sending") : t("support_submit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
