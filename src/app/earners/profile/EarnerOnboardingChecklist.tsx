'use client';

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Circle, HelpCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useT } from "@/lib/translation";

type Props = {
  earnerId: string;

  personalDetailsDone: boolean;
  profilePhotoDone: boolean;
  payoutsDone: boolean;

  onboardingChecks: {
    qr_placed?: boolean;
  };

  onRefreshProfile: () => void;
};

export function EarnerOnboardingChecklist({
  earnerId,
  personalDetailsDone,
  profilePhotoDone,
  payoutsDone,
  onboardingChecks,
  onRefreshProfile,
}: Props) {
  const { t } = useT();
  const supabase = getSupabaseBrowserClient();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [employersDone, setEmployersDone] = useState(false);
  const [loadingEmployers, setLoadingEmployers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [qrPlaced, setQrPlaced] = useState(
    onboardingChecks?.qr_placed === true
  );

  // ===============================
  // REFRESH CHECKLIST
  // ===============================
  async function refreshChecklist() {
    // employers (optional)
    setLoadingEmployers(true);
    const { count } = await supabase
      .from("employers_earners")
      .select("id", { count: "exact", head: true })
      .eq("earner_id", earnerId)
      .eq("is_active", true);

    setEmployersDone((count ?? 0) > 0);
    setLoadingEmployers(false);

    setQrPlaced(onboardingChecks?.qr_placed === true);
  }

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        onRefreshProfile();
        refreshChecklist();
      }
      return next;
    });
  }

  // refresh when tab becomes active again
  useEffect(() => {
    if (!open) return;

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        refreshChecklist();
        onRefreshProfile();
      }
    }

    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [open]);

  // ===============================
  // 🔥 CLOSE ON CLICK OUTSIDE
  // ===============================
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // ===============================
  // MANUAL QR CHECK
  // ===============================
  async function toggleQrPlaced() {
    setSaving(true);

    const newValue = !qrPlaced;

    await supabase
      .from("profiles_earner")
      .update({
        onboarding_checks: {
          ...onboardingChecks,
          qr_placed: newValue,
        },
      })
      .eq("id", earnerId);

    setQrPlaced(newValue);
    onRefreshProfile();
    setSaving(false);
  }

  const allDone =
    personalDetailsDone &&
    profilePhotoDone &&
    payoutsDone &&
    qrPlaced;

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="
          relative inline-flex items-center gap-1.5
          text-sm font-semibold
          text-green-600
          hover:text-green-700
          hover:bg-green-50
          px-2 py-1
          rounded-md
          transition
        "
      >
        <HelpCircle size={16} className="text-green-600" />
        {t("onboarding_how_get_money")}
        {!allDone && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg p-4 z-50 space-y-3 text-sm"
        >

          <ChecklistItem
            label={t("onboarding_personal_details")}
            done={personalDetailsDone}
          />

          <ChecklistItem
            label={t("onboarding_profile_photo")}
            done={profilePhotoDone}
          />

          <ChecklistItem
            label={t("onboarding_add_employers")}
            done={employersDone}
            loading={loadingEmployers}
          />

          <ChecklistItem
            label={t("onboarding_qr_activated")}
            done={payoutsDone}
          />

          <ChecklistItem
            label={t("onboarding_qr_placed")}
            done={qrPlaced}
            manual
            onClick={toggleQrPlaced}
            disabled={saving}
          />

          <ChecklistItem
            label={t("onboarding_payouts_enabled")}
            done={payoutsDone}
          />
        </div>
      )}
    </div>
  );
}

function ChecklistItem({
  label,
  done,
  manual,
  onClick,
  disabled,
  loading,
}: {
  label: string;
  done: boolean;
  manual?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-between text-slate-400">
        <span>{label}</span>
        <Circle size={18} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between ${
        manual && !disabled ? "cursor-pointer" : ""
      }`}
      onClick={manual && !disabled ? onClick : undefined}
    >
      <span>{label}</span>
      {done ? (
        <CheckCircle size={18} className="text-green-600" />
      ) : (
        <Circle size={18} className="text-slate-300" />
      )}
    </div>
  );
}
