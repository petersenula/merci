'use client';

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import type { Database } from "@/types/supabase";
import { AvatarUploader } from "./AvatarUploader";
import { GoalFields } from "./GoalFields";
import { useT } from "@/lib/translation";

type EarnerProfile = Database["public"]["Tables"]["profiles_earner"]["Row"];

type Props = { profile: EarnerProfile };

export function ProfileMyPage({ profile }: Props) {
  const supabase = getSupabaseBrowserClient();
  const { t } = useT();

  // =====================================================
  // 🔥 SINGLE SOURCE OF TRUTH
  // =====================================================
  const [freshProfile, setFreshProfile] = useState<EarnerProfile>(profile);

  // =====================================================
  // 🔥 LOAD FRESH PROFILE
  // =====================================================
  useEffect(() => {
    async function loadFresh() {
      const { data } = await supabase
        .from("profiles_earner")
        .select("*")
        .eq("id", profile.id)
        .single();

      if (data) {
        setFreshProfile(data);
      }
    }

    loadFresh();
  }, [profile.id, supabase]);

  // =====================================================
  // 🔥 SYNC GOALS FROM freshProfile
   // =====================================================
  useEffect(() => {
    setGoalTitle(freshProfile.goal_title ?? "");
    setGoalAmount(
        freshProfile.goal_amount_cents
        ? String(freshProfile.goal_amount_cents / 100)
        : ""
    );
    setGoalStartAmount(
        freshProfile.goal_start_amount
        ? String(freshProfile.goal_start_amount / 100)
        : ""
    );
    setGoalStartDate(
        freshProfile.goal_start_date?.split("T")[0] || ""
    );
    }, [
    freshProfile.goal_title,
    freshProfile.goal_amount_cents,
    freshProfile.goal_start_amount,
    freshProfile.goal_start_date,
  ]);

  // =====================================================
  // 🔥 STATE FOR GOALS (CONTROLLED)
  // =====================================================
  const [goalTitle, setGoalTitle] = useState(profile.goal_title ?? "");
  const [goalAmount, setGoalAmount] = useState(
    profile.goal_amount_cents ? String(profile.goal_amount_cents / 100) : ""
  );
  const [goalStartAmount, setGoalStartAmount] = useState(
    profile.goal_start_amount
      ? String(profile.goal_start_amount / 100)
      : ""
  );
  const [goalStartDate, setGoalStartDate] = useState(
    profile.goal_start_date?.split("T")[0] || ""
  );

  const currency = profile.currency || "CHF";

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // =====================================================
  // 🔥 AUTOSAVE GOALS
  // =====================================================
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!profile.id) return;

      setSaving(true);

      const amountCents = Math.round(Number(goalAmount || 0) * 100);
      const startAmountCents = Math.round(Number(goalStartAmount || 0) * 100);

      const { error } = await supabase
        .from("profiles_earner")
        .update({
          goal_title: goalTitle,
          goal_amount_cents: amountCents,
          goal_start_amount: startAmountCents,
          goal_start_date: goalStartDate || undefined,
        })
        .eq("id", profile.id);

      if (error) {
        console.error(error);
        setMessage(t("profile.saveError"));
      } else {
        setMessage(t("profile.saved"));

        setFreshProfile((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            goal_title: goalTitle,
            goal_amount_cents: amountCents,
            goal_start_amount: startAmountCents,
            goal_start_date: goalStartDate || "",
          };
        });
      }

      setSaving(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [goalTitle, goalAmount, goalStartAmount, goalStartDate]);

  // =====================================================
  // 🔥 PROGRESS PREVIEW (СОХРАНЁН ТВОЙ РАСЧЁТ)
  // =====================================================
  const goalAmountCentsPreview =
    goalAmount !== "" ? Math.round(Number(goalAmount) * 100) : 0;

  const goalStartAmountCentsPreview =
    goalStartAmount !== "" ? Math.round(Number(goalStartAmount) * 100) : 0;

  const progressPercentPreview =
    goalAmountCentsPreview > 0
      ? Math.min(
          100,
          Math.round(
            (goalStartAmountCentsPreview / goalAmountCentsPreview) * 100
          )
        )
      : 0;

  const progressLabelPreview =
    goalAmountCentsPreview > 0
      ? `${(goalStartAmountCentsPreview / 100).toFixed(2)} ${currency} / ${(
          goalAmountCentsPreview / 100
        ).toFixed(2)} ${currency}`
      : `${(goalStartAmountCentsPreview / 100).toFixed(2)} ${currency}`;

  // =====================================================
  // 🔥 UI
  // =====================================================
  return (
    <div className="space-y-8">

      {/* ========== INFO BLOCK BACK ON TOP ========== */}
      <div className="bg-white border rounded p-4 shadow-sm">
        <p>{t("profile.preview.title")}</p>
        <p>{t("profile.preview.subtitle")}</p>
      </div>
      {/* AVATAR UPLOADER */}
      <AvatarUploader
        userId={profile.id}
        initialUrl={freshProfile.avatar_url ?? undefined}
        onChange={(url) =>
          setFreshProfile((prev) => ({
            ...prev,
            avatar_url: url,
          }))
        }
      />

      {/* GOAL FIELDS */}
      <GoalFields
        goalTitle={goalTitle}
        goalAmount={goalAmount}
        goalStartAmount={goalStartAmount}
        goalStartDate={goalStartDate}
        currency={currency}
        onGoalTitleChange={setGoalTitle}
        onGoalAmountChange={setGoalAmount}
        onGoalStartAmountChange={setGoalStartAmount}
        onGoalStartDateChange={setGoalStartDate}
      />

      {saving && (
        <p className="text-sm text-slate-500">{t("profile.saving")}</p>
      )}
      {message && (
        <p className="text-sm text-green-600 font-medium">{message}</p>
      )}

            {/* PHONE PREVIEW */}
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl border border-slate-200 px-6 py-8 mx-auto relative pointer-events-none opacity-90">

        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-slate-300 rounded-full" />

        <div className="flex justify-center mt-4 mb-3">
          <img src="/images/logo.png" className="h-7 object-contain" />
        </div>

        {/* LANGUAGE SELECTOR same as in SchemePayPageModal */}
        <div className="flex justify-center gap-2 mb-4">
          <div className="px-3 py-1 rounded-full bg-[#E8F5ED] text-green-700 border border-green-300 text-xs font-medium">EN</div>
          <div className="px-3 py-1 rounded-full bg-slate-100 border text-slate-600 text-xs font-medium">DE</div>
          <div className="px-3 py-1 rounded-full bg-slate-100 border text-slate-600 text-xs font-medium">FR</div>
          <div className="px-3 py-1 rounded-full bg-slate-100 border text-slate-600 text-xs font-medium">IT</div>
          <div className="px-3 py-1 rounded-full bg-slate-100 border text-slate-600 text-xs font-medium">ES</div>
          <div className="px-3 py-1 rounded-full bg-slate-100 border text-slate-600 text-xs font-medium">中文</div>
        </div>

        <p className="text-center text-sm text-slate-700 mb-4">
          {t("tip_welcome_message")}
        </p>

        <div className="flex justify-center mb-2">
          {freshProfile.avatar_url ? (
            <img
              src={freshProfile.avatar_url}
              className="w-20 h-20 rounded-full object-cover border border-slate-300"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-300" />
          )}
        </div>

        <p className="text-center text-lg font-semibold text-slate-900 mb-3">
          {t("tip_im")}
          {freshProfile.display_name && (
            <span className="ml-1">{freshProfile.display_name}</span>
          )}
        </p>

        {/* ========== GOAL LOGIC (как задумано) ========== */}
        {goalTitle && (
          <>
            {/* ФРАЗА — показываем, если есть название */}
            <p className="text-center text-sm text-slate-700 mb-3 leading-tight">
              {t("tip_goal_phrase")} {goalTitle}
            </p>

            {/* ПРОГРЕСС — только если есть сумма > 0 */}
            {goalAmountCentsPreview > 0 && (
              <div className="mb-4">
                <div className="flex justify-between mb-1 text-[11px] text-slate-600">
                  <span>{t("tip_goal_label")}</span>
                  <span>{progressLabelPreview}</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full"
                    style={{ width: `${progressPercentPreview}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <p className="text-center text-sm text-slate-700 mb-2">
          {t("rating_title")}
        </p>

        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="text-yellow-400 text-xl">★</div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {["2", "5", "10", "15", "20", "30"].map((val) => (
            <button
              key={val}
              className="py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm"
            >
              {val} {currency}
            </button>
          ))}
        </div>

        <input
          disabled
          type="number"
          placeholder={`0.00 ${currency}`}
          className="w-full border border-slate-300 rounded-lg px-3 py-3 text-lg font-medium mb-3 bg-slate-100"
        />

        <button className="w-full bg-green-600 text-white font-medium py-3 rounded-lg opacity-70">
          Pay
        </button>
      </div>
    </div>
  );
}
