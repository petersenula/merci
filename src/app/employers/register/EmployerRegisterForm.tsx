'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useT } from '@/lib/translation';
import Button from '@/components/ui/button';
import { useLoading } from "@/context/LoadingContext";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";

const supabase = getSupabaseBrowserClient();

export default function EmployerRegisterForm() {
  const router = useRouter();
  const { t, lang } = useT();
  const { show, hide } = useLoading();

  const [userId, setUserId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('CH');
  const [city, setCity] = useState('');

  // ⭐ НОВОЕ: выбор типа Stripe-аккаунта
  const [stripeBusinessType, setStripeBusinessType] =
    useState<'individual' | 'company'>('individual');

  const ALLOWED_COUNTRIES = [
    { code: "CH", label: "Switzerland" },
    { code: "LI", label: "Liechtenstein" },
  ];

  type SubmitState = "idle" | "submitting" | "redirecting";
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "redirecting"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // Load session + company name saved from step 1
  useEffect(() => {
    const load = async () => {
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          setUserId(data.user.id);

          const stored = window.localStorage.getItem("employer_company_name");
          if (stored) setCompanyName(stored);

          return;
        }
        await new Promise(r => setTimeout(r, 100));
      }
    };
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitState("submitting");
    show();

    try {
      const res = await fetch('/api/employers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: companyName,
          category,
          phone,
          country_code: country,
          city,
          lang,
          stripe_business_type: stripeBusinessType,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ? t(json.error) : t("register_error"));
        setSubmitState("idle");
        hide();
        return;
      }

      // ⛔ ВАЖНО: дальше НИКАКИХ setState
      setSubmitState("redirecting");

      // Stripe управляет страницей
      window.location.href = json.onboardingUrl;

    } catch (err) {
      setError(t("register_error"));
      setSubmitState("idle");
      hide();
    }

  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-3xl mx-auto space-y-8">

        <div>
          <p className="text-xs uppercase text-slate-500">{t("step2of2")}</p>
          <h1 className="text-3xl font-semibold mt-1">{t("register_title")}</h1>
          <p className="text-sm text-slate-600">{t("register_subtitle")}</p>
        </div>

        <div className="rounded-2xl bg-white shadow-lg p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Company name */}
            <div>
              <label className="block text-sm mb-1">
                {t("register_companyName")} <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* ⭐ НОВОЕ: Stripe account type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {t("register_business_type")}
              </label>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="stripeBusinessType"
                    value="individual"
                    checked={stripeBusinessType === 'individual'}
                    onChange={() => setStripeBusinessType('individual')}
                  />
                  {t("register_business_type_individual")}
                </label>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="stripeBusinessType"
                    value="company"
                    checked={stripeBusinessType === 'company'}
                    onChange={() => setStripeBusinessType('company')}
                  />
                  {t("register_business_type_company")}
                </label>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm mb-1">{t("register_category")}</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm mb-1">{t("register_phone")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+41 79 123 45 67"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Country */}
            <SearchableDropdown
              value={country}
              onChange={setCountry}
              label={t("register_country")}
              options={ALLOWED_COUNTRIES}
            />

            {/* Currency (read-only) */}
            <div>
              <label className="block text-sm mb-1">
                {t("profile.currency")}
              </label>
              <input
                disabled
                value="CHF"
                className="w-full border rounded-lg px-3 py-2 bg-slate-100 text-slate-700 cursor-not-allowed"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm mb-1">{t("register_city")}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {error && (
              <div className="text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm leading-relaxed text-blue-800">
              {t("register_stripe_note_employer")}
            </div>

            <Button
              type="submit"
              disabled={submitState !== "idle"}
              variant="green"
              className="w-full flex items-center justify-center"
            >
              {submitState === "idle" && t("register_submit")}

              {submitState === "submitting" && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>{t("register_submitting")}</span>
                </div>
              )}

              {submitState === "redirecting" && (
                <span>{t("redirecting_to_stripe")}</span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
