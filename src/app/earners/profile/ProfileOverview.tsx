'use client';

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import type { Database } from "@/types/supabase";
import { PersonalInfo } from "./PersonalInfo";
import { useT } from "@/lib/translation";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { Dropdown } from "@/components/ui/Dropdown";
import { allCountries } from "@/data/countries";
import { currencies } from "@/data/currencies";

type EarnerProfile = Database['public']['Tables']['profiles_earner']['Row'];

type Props = {
  profile: EarnerProfile;
  onProfileUpdated?: (profile: EarnerProfile) => void;
};

export function ProfileOverview({ profile, onProfileUpdated }: Props) {
  const { t } = useT();
  const supabase = getSupabaseBrowserClient();

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [countryCode, setCountryCode] = useState(
    profile.country_code === "LI" || profile.country_code === "CH"
      ? profile.country_code
      : "CH"
  );
  const [currency, setCurrency] = useState(profile.currency ?? "CHF");

  const [saving, setSaving] = useState(false);

  // 🔥 универсальная функция сохранения
  const saveField = useCallback(
    async (field: string, value: string) => {
      setSaving(true);

      const { data, error } = await supabase
        .from("profiles_earner")
        .update({ [field]: value })
        .eq("id", profile.id)
        .select("*")
        .single();

      if (error) {
        console.error("Save error:", error);
      } else if (data && onProfileUpdated) {
        onProfileUpdated(data);
      }

      setSaving(false);
    },
    [supabase, profile.id, onProfileUpdated]
  );

  // 🔥 DEBOUNCE 600ms
  function useAutoSave(value: string, field: string) {
    useEffect(() => {
      if (value === undefined) return;

      const timer = setTimeout(() => {
        saveField(field, value);
      }, 600);

      return () => clearTimeout(timer);
    }, [value, field]);
  }

  // поля, которые сохраняем автоматически
  useAutoSave(displayName, "display_name");
  useAutoSave(city, "city");
  useAutoSave(countryCode, "country_code");

  return (
    <div className="space-y-6">
      <PersonalInfo
        email={profile.email}
        firstName={profile.first_name}
        lastName={profile.last_name}
      />
      {/* Currency (read-only) */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("profile.currency")}
        </label>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-700 cursor-not-allowed"
          value="CHF"
          disabled
        />
      </div>
      {/* Display name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("profile.displayName")} <span className="text-red-500">*</span>
        </label>

        <input
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t("profile.displayNamePlaceholder")}
        />
      </div>

            {/* Country: SearchableDropdown */}
      <SearchableDropdown
        value={countryCode}
        onChange={(val) => setCountryCode(val)}
        label={t("register_country")}
        options={allCountries}
      />

      {/* City */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("profile.city")}</label>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t("profile.cityPlaceholder")}
        />
      </div>

      {saving && (
        <p className="text-sm text-slate-500">{t("profile.saving")}</p>
      )}
    </div>
  );
}
