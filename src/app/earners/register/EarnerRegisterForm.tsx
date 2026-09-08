'use client';

import { useState } from 'react';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import { useT } from '@/lib/translation';
import Button from '@/components/ui/button';
import { Dropdown } from "@/components/ui/Dropdown";
import { allCountries } from "@/data/countries";
import { currencies } from "@/data/currencies";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import LoaderOverlay from "@/components/ui/LoaderOverlay";


export default function EarnerRegisterForm() {
  const { t, lang } = useT();
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('CH');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authenticatedFetch('/api/earners/register', {
        method: 'POST',
        body: JSON.stringify({
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
          city,
          country_code: country,
          phone: phone ?? null,
          lang,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || t("register_error"));
        setLoading(false); // ⬅️ ТОЛЬКО если ошибка
        return;
      }

      setSuccess(true);

      // 🔴 ВАЖНО: гасим loader перед уходом со страницы
      setLoading(false);

      // Stripe управляет страницей дальше
      window.location.href = json.onboardingUrl;

    } catch (err) {
      setError(t("register_error"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 flex items-center justify-center">
      <LoaderOverlay show={loading} />
      <div className="w-full max-w-3xl mx-auto space-y-8">

        <div>
          <p className="text-xs uppercase text-slate-500">{t("step2of2")}</p>
          <h1 className="text-3xl font-semibold mt-1">{t("register_title")}</h1>
          <p className="text-sm text-slate-600">{t("register_subtitle")}</p>
        </div>

        <div className="rounded-2xl bg-white shadow-lg p-6 space-y-6">

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* First / Last */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">{t("register_firstName")}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">{t("register_lastName")}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* Display name */}
            <div>
              <label className="block text-sm mb-1">{t("register_displayName")}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("register_phone")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+41 79 123 45 67"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Country */}
            <SearchableDropdown
              value={country}
              onChange={setCountry}
              label={t("register_country")}
              options={allCountries}
            />

            {/* City */}
            <div>
              <label className="block text-sm mb-1">{t("register_city")}</label>
              <input
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

            {success && (
              <div className="text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg text-sm">
                {t("register_success")}
              </div>
            )}

            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm leading-relaxed text-blue-800 space-y-2">
              <p>{t("register_stripe_note")}</p>
              <strong className="block">
                {t("register_stripe_note_iban")}
              </strong>
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="green"
              className="w-full"
            >
              {loading ? t("register_submitting") : t("register_submit")}
            </Button>

          </form>
        </div>
      </div>
    </div>
  );
}
