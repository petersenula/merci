'use client';

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import type { Database } from "@/types/supabase";
import { useT } from "@/lib/translation";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { Dropdown } from "@/components/ui/Dropdown";
import { allCountries } from "@/data/countries";
import { currencies } from "@/data/currencies";

type EmployerProfile = Database["public"]["Tables"]["employers"]["Row"];

type Props = {
  profile: EmployerProfile;
  onProfileUpdated?: (profile: EmployerProfile) => void;
};

type Address = {
  city?: string;
};

const languages = [
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
  { code: "fr", label: "FR" },
  { code: "it", label: "IT" },
];

export function EmployerOverview({ profile, onProfileUpdated }: Props) {
  const { t } = useT(); // 🔹 setLocale убрали
  const supabase = getSupabaseBrowserClient();
  const [freshProfile, setFreshProfile] = useState(profile);
  // ====== LOCAL STATE ======
  // name и email показываем, но не редактируем
  const name = profile.name ?? "";
  const billingEmail = profile.billing_email ?? "";

  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [countryCode, setCountryCode] = useState("CH");
  const [city, setCity] = useState("");
  const [locale, setLocalLocale] = useState("en");
  const [displayName, setDisplayName] = useState("");

  const [saving, setSaving] = useState(false);
  const ALLOWED_COUNTRIES = [
    { code: "CH", name: "Switzerland" },
    { code: "LI", name: "Liechtenstein" },
  ];

  useEffect(() => {
    async function loadFresh() {
      const { data, error } = await supabase
        .from("employers")
        .select("*")
        .eq("user_id", profile.user_id)
        .single();

      if (error) {
        console.error("Failed to load fresh employer profile", error);
        return;
      }

      if (data) {
        setFreshProfile(data);

        setPhone(data.phone ?? "");
        setCategory(data.category ?? "");
        setCountryCode(
          data.country_code === "CH" || data.country_code === "LI"
            ? data.country_code
            : "CH"
        );
        const address = data.address as Address | null;
        setCity(address?.city ?? "");
        setLocalLocale(data.locale ?? "en");
        setDisplayName(data.display_name ?? "");
      }
    }

    loadFresh();
  }, [profile.user_id, supabase]);

  // ====== SAVE FUNCTION ======
  const saveField = useCallback(
    async (field: string, value: string | null) => {
      setSaving(true);

      const { data, error } = await supabase
        .from("employers")
        .update({ [field]: value })
        .eq("user_id", profile.user_id)
        .select("*")
        .single();

        if (error) {
          console.error("Save error:", error);
        } else if (data) {
          setFreshProfile(data);
          onProfileUpdated?.(data); // 👈 И СЮДА
        }
      setSaving(false);
    },
    [supabase, profile.user_id]
  );

  // ====== AUTOSAVE (DEBOUNCE 600ms) ======
  function useAutoSave(value: any, field: string) {
    useEffect(() => {
      if (value === undefined) return;

      const timer = setTimeout(() => {
        saveField(field, value || null);
      }, 600);

      return () => clearTimeout(timer);
    }, [value, field]);
  }

  // только редактируемые поля
  useAutoSave(phone, "phone");
  useAutoSave(displayName, "display_name");
  useAutoSave(category, "category");
  useAutoSave(countryCode, "country_code");
  useAutoSave(locale, "locale");
  useEffect(() => {
    if (city === undefined) return;

  const timer = setTimeout(async () => {
    const { data, error } = await supabase
      .from("employers")
      .update({ address: city ? { city } : null })
      .eq("user_id", profile.user_id)
      .select("*")
      .single();

    if (error) {
      console.error("Save error:", error);
    } else if (data) {
      setFreshProfile(data);
    }
  }, 600);

    return () => clearTimeout(timer);
  }, [city, supabase, profile.user_id]);

  // ====== UI ======
  return (
    <div className="space-y-6">

      {/* READ-ONLY Company Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("register_companyName")}</label>
        <input
          className="w-full border border-slate-300 bg-slate-100 rounded-lg px-3 py-2 text-sm"
          value={name}
          disabled
        />
      </div>

      {/* Display Name (editable) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("employer_display_name")} <span className="text-red-500">*</span>
        </label>
        <input
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t("employer_display_name_placeholder").replace("{{company}}", name)}
        />
      </div>

      {/* READ-ONLY Billing Email */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("personal.email")}</label>
        <input
          type="email"
          className="w-full border border-slate-300 bg-slate-100 rounded-lg px-3 py-2 text-sm"
          value={billingEmail}
          disabled
        />
      </div>

      {/* PHONE + LANGUAGE SWITCHER */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("register_phone")}</label>

        <div className="flex items-center gap-4">
          {/* PHONE */}
          <input
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+41 ..."
          />

          {/* LANGUAGE BUTTONS */}
          <div className="flex gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLocalLocale(l.code);        // меняем локальный стейт
                  // сохранится в Supabase через useAutoSave(locale, "locale")
                }}
                className={
                  locale === l.code
                    ? "px-3 py-1 rounded-full bg-green-600 text-white text-xs font-medium shadow"
                    : "px-3 py-1 rounded-full border border-slate-300 text-xs text-slate-600 hover:bg-slate-100"
                }
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Currency (read-only) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("profile.currency")}
        </label>
        <input
          className="w-full border border-slate-300 bg-slate-100 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
          value="CHF"
          disabled
        />
      </div>

      {/* Country dropdown */}
      <SearchableDropdown
        value={countryCode}
        onChange={(val) => setCountryCode(val)}
        label={t("register_country")}
        options={allCountries}
      />

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("register_category")}</label>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder={t("employer.categoryPlaceholder")}
        />
      </div>

      {/* City */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("employer.city")}</label>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t("employer.cityPlaceholder")}
        />
      </div>

      {/* Saving indicator */}
      {saving && (
        <p className="text-sm text-slate-500">{t("profile.saving")}</p>
      )}
    </div>
  );
}
