'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TipPreview } from "@/components/preview/TipPreview";
import { AvatarUploader } from './AvatarUploader';
import { CountrySelect } from './CountrySelect';
import { CurrencySelect } from './CurrencySelect';
import { GoalFields } from './GoalFields';
import { PersonalInfo } from './PersonalInfo';
import { useT } from "@/lib/translation";

type EarnerProfile = Database['public']['Tables']['profiles_earner']['Row'];

type Props = {
  profile: EarnerProfile;
};

export function ProfileDetails({ profile }: Props) {
  const { t } = useT();

  // -----------------------------
  // STATE
  // -----------------------------

  // Display name
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);

  // Goal fields
  const [goalTitle, setGoalTitle] = useState(profile.goal_title ?? '');
  const initialAmount =
    typeof profile.goal_amount_cents === 'number'
      ? String(profile.goal_amount_cents / 100)
      : '';
  const [goalAmount, setGoalAmount] = useState(initialAmount);

  // City
  const [city, setCity] = useState(profile.city ?? '');

  // Country
  const [countryCode, setCountryCode] = useState(profile.country_code ?? 'CH');

  // Currency
  const [currency, setCurrency] = useState(profile.currency ?? 'CHF');

  // Новые поля цели
  const [goalStartAmount, setGoalStartAmount] = useState(
    typeof profile.goal_start_amount === 'number'
      ? String(profile.goal_start_amount / 100)
      : '0',
  );

  // Save state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  type ProfileUpdate =
  Database['public']['Tables']['profiles_earner']['Update'];

  // -----------------------------
  // SAVE HANDLER
  // -----------------------------
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const amountNumber = goalAmount === '' ? 0 : Number(goalAmount);
    const amountCents = Math.round(amountNumber * 100);

    const startAmountNumber =
      goalStartAmount === '' ? 0 : Number(goalStartAmount);
    const startAmountCents = Math.round(startAmountNumber * 100);

    const updates: ProfileUpdate = {
      display_name: displayName,
      avatar_url: avatarUrl,
      goal_title: goalTitle,
      goal_amount_cents: amountCents,
      goal_start_amount: startAmountCents,
      city: city,
      country_code: countryCode,
      currency: currency,
    };

    const { data, error } = await supabaseClient
    .from('profiles_earner')
    .update(updates)          // ← ОБЯЗАТЕЛЬНО
    .eq('id', profile.id)
    .select()
    .single();

    if (error) {
      console.error('Error updating profile', error);
      setMessage(t('profile.saveError'));
      setSaving(false);
      return;
    }

    if (!data) {
      setSaving(false);
      return;
    }

    // обновляем state
    setDisplayName(data.display_name);
    setAvatarUrl(data.avatar_url);
    setGoalTitle(data.goal_title ?? '');
    setGoalAmount(String(data.goal_amount_cents / 100));
    setGoalStartAmount(String((data.goal_start_amount ?? 0) / 100));
    setCity(data.city ?? '');
    setCountryCode(data.country_code ?? 'CH');
    setCurrency(data.currency ?? 'CHF');

    setMessage('Сохранено ✔');
    setSaving(false);
  };

  // -----------------------------
  // Вспомогательные расчёты для превью
  // -----------------------------
  const goalAmountCentsPreview =
    goalAmount !== '' ? Math.round(Number(goalAmount) * 100) : 0;
  const goalStartAmountCentsPreview =
    goalStartAmount !== '' ? Math.round(Number(goalStartAmount) * 100) : 0;

  const progressPercentPreview =
    goalAmountCentsPreview > 0
      ? Math.min(
          100,
          Math.round(
            (goalStartAmountCentsPreview / goalAmountCentsPreview) * 100,
          ),
        )
      : 0;

  const progressLabelPreview =
    goalAmountCentsPreview > 0
      ? `${(goalStartAmountCentsPreview / 100).toFixed(2)} ${currency} / ${(
          goalAmountCentsPreview / 100
        ).toFixed(2)} ${currency}`
      : `${(goalStartAmountCentsPreview / 100).toFixed(2)} ${currency}`;

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <Card className="p-4 space-y-6">
      {/* Personal info (email, first name, last name) */}
      <PersonalInfo
        email={profile.email}
        firstName={profile.first_name}
        lastName={profile.last_name}
      />

      {/* Display name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("profile.displayName")}</label>
        <input
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t("profile.displayNamePlaceholder")}
        />
      </div>

      {/* Avatar uploader */}
      <AvatarUploader
        userId={profile.id}
        initialUrl={avatarUrl ?? undefined}
        onChange={setAvatarUrl}
      />

      {/* Goal title + amount */}
      <GoalFields
        goalTitle={goalTitle}
        goalAmount={goalAmount}
        goalStartAmount={goalStartAmount}
        goalStartDate={profile.goal_start_date?.split("T")[0] || ""}
        currency={currency}
        onGoalTitleChange={setGoalTitle}
        onGoalAmountChange={setGoalAmount}
        onGoalStartAmountChange={setGoalStartAmount}
        onGoalStartDateChange={(date) => console.log("update date here")}
      />

      {/* City */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t("profile.city")}</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t("profile.cityPlaceholder")}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Country */}
      <CountrySelect value={countryCode} onChange={setCountryCode} />

      {/* Currency */}
      <CurrencySelect value={currency} onChange={setCurrency} />

      {/* Save button */}
      <Button variant="green" onClick={handleSave} disabled={saving}>
        {saving ? t("profile.saving") : t("profile.save")}
      </Button>
      {message && (
        <p className="text-sm text-green-600 font-medium">{t("profile.saved")}</p>
      )}
      {/* ----------------------------- */}
      {/* Превью экрана плательщика     */}
      {/* ----------------------------- */}
      <div className="mt-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-2">
        {t("profile.preview.title")}
      </h3>

        <div className="w-full max-w-xs bg-slate-50 rounded-[2rem] border border-slate-300 shadow-md px-4 pt-6 pb-6 mx-auto relative overflow-hidden">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-slate-300 rounded-full" />

          {/* Лого */}
          <div className="flex justify-center mb-4 mt-2">
            <img
              src="/images/logo.png"
              alt="click4tip"
              className="h-6 object-contain"
            />
          </div>

          {/* Welcome text */}
          <p className="text-center text-[11px] leading-tight text-slate-700 mb-3">
            {t("tip_welcome_message")}
          </p>

          {/* Avatar + name */}
          <div className="flex flex-col items-center mb-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 text-base font-semibold">
                {displayName?.charAt(0).toUpperCase() ?? '?'}
              </div>
            )}

            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              {t("tip_hello")}
            </p>

            <p className="font-semibold text-slate-900 text-sm">
              {t("tip_im").replace("{name}", displayName || "—")}
            </p>
          </div>

          {/* Goal text */}
          <p className="text-center text-[11px] text-slate-700 leading-tight mb-3">
            {t("tip_goal_phrase").replace("{goal_title}", goalTitle || "—")}
          </p>

          {/* Прогресс */}
          <div className="mb-3">
            <div className="flex items-baseline justify-between mb-1">
            <p className="text-[11px] font-medium text-slate-700">
              {t("tip_goal_label")}
            </p>
              <p className="text-[11px] text-slate-600">
                {progressLabelPreview}
              </p>
            </div>

            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0DA067] rounded-full"
                style={{ width: `${progressPercentPreview}%` }}
              />
            </div>
          </div>

          {/* Заглушка формы оплаты */}
          <p className="text-[10px] text-slate-500">
            {t("tip.paymentPlaceholder")}
          </p>
        </div>
      </div>
    </Card>
  );
}
