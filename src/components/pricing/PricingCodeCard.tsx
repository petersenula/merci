"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Tag } from "lucide-react";

import { useT } from "@/lib/translation";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type CurrentPricingResponse = {
  code: string | null;
};

type ApplyPricingResponse = {
  success?: boolean;
  code?: string | null;
};

export default function PricingCodeCard() {
  const { t } = useT();
  const supabase = getSupabaseBrowserClient();

  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentCode() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Not authenticated");
        }

        const res = await fetch("/api/pricing/current", {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load pricing code");
        }

        const data = (await res.json()) as CurrentPricingResponse;

        if (!cancelled) {
          setCurrentCode(data.code ?? null);
        }
      } catch (error) {
        console.error("PRICING CODE LOAD ERROR:", error);

        if (!cancelled) {
          setErrorKey("pricing_code_load_error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCurrentCode();

    return () => {
      cancelled = true;
    };
  }, []);

  async function applyCode(event: FormEvent) {
    event.preventDefault();

    const code = inputCode.trim();

    if (!code || applying) return;

    setApplying(true);
    setSuccess(false);
    setErrorKey(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setErrorKey("pricing_code_apply_error");
        return;
      }

      const res = await fetch("/api/pricing/apply-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.code === "PRICING_CODE_EXPIRED") {
          setErrorKey("pricing_code_expired");
        } else if (data?.code === "PRICING_CODE_INVALID") {
          setErrorKey("pricing_code_invalid");
        } else {
          setErrorKey("pricing_code_apply_error");
        }

        return;
      }

      const applied = (data as ApplyPricingResponse).code ?? code.toUpperCase();

      setCurrentCode(applied);
      setInputCode("");
      setSuccess(true);
    } catch (error) {
      console.error("PRICING CODE APPLY ERROR:", error);
      setErrorKey("pricing_code_apply_error");
    } finally {
      setApplying(false);
    }
  }

  async function resetCode() {
    if (!currentCode || resetting) return;

    setResetting(true);
    setSuccess(false);
    setErrorKey(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setErrorKey("pricing_code_reset_error");
        return;
      }

      const res = await fetch("/api/pricing/reset", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        setErrorKey("pricing_code_reset_error");
        return;
      }

      setCurrentCode(null);
      setInputCode("");
      setSuccess(false);
    } catch (error) {
      console.error("PRICING CODE RESET ERROR:", error);
      setErrorKey("pricing_code_reset_error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
          <Tag size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900">
            {t("pricing_code_title")}
          </h3>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {t("pricing_code_description")}
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-slate-500">
              {t("pricing_code_loading")}
            </p>
          ) : (
            <>
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t("pricing_code_current")}
                </p>

                {currentCode ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                    <CheckCircle2 size={16} className="text-green-700" />
                    <span className="text-sm font-semibold text-green-800">
                      {currentCode}
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">
                    {t("pricing_code_none")}
                  </p>
                )}
              </div>

              {currentCode && (
                <button
                  type="button"
                  onClick={resetCode}
                  disabled={resetting}
                  className="mt-3 text-sm font-medium text-slate-600 underline underline-offset-2 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resetting
                    ? t("pricing_code_resetting")
                    : t("pricing_code_reset")}
                </button>
              )}

              <form onSubmit={applyCode} className="mt-4">
                <label
                  htmlFor="pricing-code"
                  className="text-sm font-medium text-slate-800"
                >
                  {currentCode
                    ? t("pricing_code_change_label")
                    : t("pricing_code_add_label")}
                </label>

                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="pricing-code"
                    type="text"
                    value={inputCode}
                    onChange={(event) => {
                      setInputCode(event.target.value);
                      setSuccess(false);
                      setErrorKey(null);
                    }}
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={100}
                    placeholder={t("pricing_code_placeholder")}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />

                  <button
                    type="submit"
                    disabled={!inputCode.trim() || applying}
                    className="inline-flex items-center justify-center rounded-lg bg-[#1FB94A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#16963B] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {applying
                      ? t("pricing_code_applying")
                      : t("pricing_code_apply")}
                  </button>
                </div>
              </form>

              {success && (
                <p className="mt-3 text-sm font-medium text-green-700">
                  {t("pricing_code_success")}
                </p>
              )}

              {errorKey && (
                <p className="mt-3 text-sm font-medium text-red-600">
                  {t(errorKey)}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
