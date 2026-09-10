'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useT } from '@/lib/translation';
import Button from '@/components/ui/button';
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import LoaderOverlay from "@/components/ui/LoaderOverlay";

export default function EmployerRegisterForm() {
  const router = useRouter();
  const { t, lang } = useT();

  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('CH');
  const [city, setCity] = useState('');

  const [paymentAccountMode, setPaymentAccountMode] =
    useState<'own_account' | 'team_only'>('own_account');

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

  // Load the company name saved during the first registration step
  useEffect(() => {
    const stored = window.localStorage.getItem("employer_company_name");
    if (stored) setCompanyName(stored);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitState("submitting");

    try {
      const res = await authenticatedFetch('/api/employers/register', {
        method: 'POST',
        body: JSON.stringify({
          name: companyName,
          category,
          phone,
          country_code: country,
          city,
          lang,
          payment_account_mode: paymentAccountMode,
          stripe_business_type:
            paymentAccountMode === 'own_account'
              ? stripeBusinessType
              : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ? t(json.error) : t("register_error"));
        setSubmitState("idle");
        return;
      }

      if (json.onboardingUrl) {
        setSubmitState("redirecting");
        window.location.href = json.onboardingUrl;
        return;
      }

      router.push('/employers/profile');

    } catch (err) {
      setError(t("register_error"));
      setSubmitState("idle");
    }

  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 flex items-center justify-center">
      <LoaderOverlay
        show={submitState === "submitting" || submitState === "redirecting"}
      />
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

            {/* Payment account mode */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                {t("register_payment_account_mode_title")}
              </label>

              <label
                className={`block cursor-pointer rounded-xl border p-4 ${
                  paymentAccountMode === 'own_account'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentAccountMode"
                    value="own_account"
                    checked={paymentAccountMode === 'own_account'}
                    onChange={() => setPaymentAccountMode('own_account')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">
                      {t("register_payment_account_mode_own")}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {t("register_payment_account_mode_own_help")}
                    </p>
                  </div>
                </div>
              </label>

              <label
                className={`block cursor-pointer rounded-xl border p-4 ${
                  paymentAccountMode === 'team_only'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentAccountMode"
                    value="team_only"
                    checked={paymentAccountMode === 'team_only'}
                    onChange={() => setPaymentAccountMode('team_only')}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">
                      {t("register_payment_account_mode_team_only")}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {t("register_payment_account_mode_team_only_help")}
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {paymentAccountMode === 'own_account' && (
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
            )}

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
                placeholder={t("register_postcode_placeholder")}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {error && (
              <div className="text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {paymentAccountMode === 'own_account' && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm leading-relaxed text-blue-800 space-y-2">
                <p>{t("register_stripe_note_employer")}</p>
                <strong className="block">
                  {t("register_stripe_note_employer_iban")}
                </strong>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitState !== "idle"}
              variant="green"
              className="w-full flex items-center justify-center"
            >
              {submitState === "idle" &&
                (paymentAccountMode === 'team_only'
                  ? t("register_submit_team_only")
                  : t("register_submit"))}

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
