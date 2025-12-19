'use client';

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import type { Database } from "@/types/supabase";
import { useT } from "@/lib/translation";

import ProgressBarSmart from "@/components/ProgressBarSmart";
import { EmployerLogoUploader } from "./EmployerLogoUploader";
import { EmployerGoalFields } from "./EmployerGoalFields";

type EmployerProfile = Database["public"]["Tables"]["employers"]["Row"];

type Props = { profile: EmployerProfile };

export function EmployerMyPage({ profile }: Props) {
  const supabase = getSupabaseBrowserClient();
  const { t } = useT();

  const [freshProfile, setFreshProfile] = useState(profile);

  // ========= STATE FOR GOALS =========
  const [goalTitle, setGoalTitle] = useState(profile.goal_title ?? "");
  const [goalAmount, setGoalAmount] = useState(
    profile.goal_amount_cents ? String(profile.goal_amount_cents / 100) : ""
  );
  const [goalStartAmount, setGoalStartAmount] = useState(
    profile.goal_start_amount ? String(profile.goal_start_amount / 100) : ""
  );
  const [goalStartDate, setGoalStartDate] = useState(
    profile.goal_start_date?.split("T")[0] || ""
  );

  const currency = profile.currency || "CHF";

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // ========= LOAD FRESH PROFILE =========
  useEffect(() => {
    async function loadFresh() {
      const { data } = await supabase
        .from("employers")
        .select("*")
        .eq("user_id", profile.user_id)
        .single();

      if (data) {
        setFreshProfile(data);

        setGoalTitle(data.goal_title ?? "");
        setGoalAmount(
          data.goal_amount_cents ? String(data.goal_amount_cents / 100) : ""
        );
        setGoalStartAmount(
          data.goal_start_amount ? String(data.goal_start_amount / 100) : ""
        );
        setGoalStartDate(data.goal_start_date?.split("T")[0] || "");

      }
    }

    loadFresh();
  }, [profile.user_id, supabase]);

  // ========= AUTOSAVE ALL FIELDS =========
  useEffect(() => {
    const timeout = setTimeout(async () => {
      setSaving(true);

      const amountCents = Math.round(Number(goalAmount || 0) * 100);
      const startAmountCents = Math.round(Number(goalStartAmount || 0) * 100);

      const { error } = await supabase
        .from("employers")
        .update({
          goal_title: goalTitle,
          goal_amount_cents: amountCents,
          goal_start_amount: startAmountCents,
          goal_start_date: goalStartDate || null,
        })
        .eq("user_id", profile.user_id);

      if (error) {
        console.error(error);
        setMessage(t("profile.saveError"));
      } else {
        setMessage(t("profile.saved"));

        setFreshProfile((prev) => ({
          ...prev,
          goal_title: goalTitle,
          goal_amount_cents: amountCents,
          goal_start_amount: startAmountCents,
          goal_start_date: goalStartDate || null,
        }));
      }

      setSaving(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [goalTitle, goalAmount, goalStartAmount, goalStartDate]);

  // ========= PREVIEW CALCULATIONS =========
  const goalAmountCentsPreview =
    goalAmount !== "" ? Math.round(Number(goalAmount) * 100) : null;

  const goalStartAmountCentsPreview =
    goalStartAmount !== "" ? Math.round(Number(goalStartAmount) * 100) : 0;

  const earnedSinceStart = 0; // employer has NO earned tips

  // ========= UI =========
  return (
    <div className="space-y-8">

      {/* ========== INFO BLOCK BACK ON TOP ========== */}
      <div className="bg-white border rounded p-4 shadow-sm">
        <p>{t("profile.preview.title")}</p>
        <p>{t("profile.preview.subtitle")}</p>
      </div>

      {/* ========== EDIT FIELDS ========== */}
      <EmployerLogoUploader
        userId={profile.user_id}
        initialUrl={freshProfile.logo_url ?? undefined}
        onChange={(url) =>
          setFreshProfile((prev) => ({
            ...prev,
            logo_url: url,
          }))
        }
      />

      <EmployerGoalFields
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

      {/* STATUS MESSAGES */}
      {saving && (
        <p className="text-sm text-slate-500">{t("profile.saving")}</p>
      )}
      {message && (
        <p className="text-sm text-green-600 font-medium">{message}</p>
      )}

      {/* ========== PHONE PREVIEW ========== */}
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl border border-slate-200 px-6 py-8 mx-auto relative pointer-events-none opacity-90">

        {/* NOTCH */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-slate-300 rounded-full" />

        {/* LANGUAGE SELECTOR same as in SchemePayPageModal */}
        <div className="flex justify-center gap-2 mb-4">
          <div className="px-3 py-1 rounded-full bg-[#E8F5ED] text-green-700 border border-green-300 text-xs font-medium">EN</div>
          <div className="px-3 py-1 rounded-full bg-slate-100 border text-slate-600 text-xs font-medium">DE</div>
          <div className="px-3 py-1 rounded-full bg-slate-100 border text-slate-600 text-xs font-medium">FR</div>
          <div className="px-3 py-1 rounded-full bg-slate-100 border text-slate-600 text-xs font-medium">IT</div>
          <div className="px-3 py-1 rounded-full bg-slate-100 border text-slate-600 text-xs font-medium">ES</div>
          <div className="px-3 py-1 rounded-full bg-slate-100 border text-slate-600 text-xs font-medium">中文</div>
        </div>
        {/* WELCOME MESSAGE */}
        <p className="text-center text-sm text-slate-700 mb-4">
          {t("tip_welcome_message")}
        </p>
        {/* LOGO */}
        <div className="flex justify-center mb-2">
          {freshProfile.logo_url ? (
            <img
              src={freshProfile.logo_url}
              className="w-20 h-20 rounded-full object-cover border border-slate-300"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-300" />
          )}
        </div>
        {/* NAME */}
        <p className="text-center text-lg font-semibold text-slate-900 mb-3">
          {freshProfile.display_name || freshProfile.name}
        </p>

        {/* ========== GOAL LOGIC ========== */}
        {goalTitle && (
          <p className="text-center text-sm text-slate-700 mb-3 leading-tight">
            {t("tip_goal_phrase")} {goalTitle}
          </p>
        )}

        {goalTitle && goalAmountCentsPreview && (
          <ProgressBarSmart
            goalAmountCents={goalAmountCentsPreview}
            goalStartAmount={goalStartAmountCentsPreview}
            goalEarnedSinceStart={earnedSinceStart}
            currency={currency}
          />
        )}

        {/* STARS */}
        <p className="text-center text-sm text-slate-700 mb-2">
          {t("rating_title")}
        </p>

        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="text-yellow-400 text-xl">
              ★
            </div>
          ))}
        </div>

        {/* QUICK AMOUNTS — STILL DISABLED */}
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

        {/* MANUAL INPUT — DISABLED */}
        <input
          disabled
          type="number"
          placeholder={`0.00 ${currency}`}
          className="w-full border border-slate-300 rounded-lg px-3 py-3 text-lg font-medium mb-3 bg-slate-100"
        />

        {/* PAY BUTTON — GREEN BUT DISABLED */}
        <button className="w-full bg-green-600 text-white font-medium py-3 rounded-lg opacity-70">
          Pay
        </button>
      </div>
    </div>
  );
}
