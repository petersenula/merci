'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { useT } from "@/lib/translation";
import { CheckCircle, Circle, HelpCircle } from "lucide-react";
import { usePWAInstall } from "@/lib/usePWAInstall";

type Props = {
  employerId: string;
  personalDetailsDone: boolean;
  profilePhotoDone: boolean;
  payoutsDone: boolean;
  paymentAccountMode: string;
  onRefreshProfile: () => void;
  onboardingChecks: {
    qr_placed?: boolean;
  };
  onNavigate: (tab: string) => void;
};

export function EmployerOnboardingChecklist({
  employerId,
  personalDetailsDone,
  profilePhotoDone,
  payoutsDone,
  paymentAccountMode,
  onboardingChecks,
  onRefreshProfile,
  onNavigate,
}: Props) {

  const { t } = useT();
  const supabase = getSupabaseBrowserClient();
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [schemeDone, setSchemeDone] = useState<boolean>(false);
  const [loadingSchemes, setLoadingSchemes] = useState(false);

  const [employeesDone, setEmployeesDone] = useState<boolean>(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [qrPlaced, setQrPlaced] = useState(
    onboardingChecks?.qr_placed === true
  );

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const refreshChecklist = useCallback(async () => {
    setLoadingEmployees(true);
    setLoadingSchemes(true);

    try {
      const res = await authenticatedFetch("/api/onboarding/checklist?role=employer");

      if (!res.ok) {
        throw new Error(`Checklist request failed with status ${res.status}`);
      }

      const data = await res.json();

      setEmployeesDone(data.employeesDone === true);
      setSchemeDone(data.schemeDone === true);
      setQrPlaced(onboardingChecks?.qr_placed === true);
    } catch (error) {
      console.error("Employer checklist refresh failed:", error);
    } finally {
      setLoadingEmployees(false);
      setLoadingSchemes(false);
    }
  }, [onboardingChecks]);
  
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
  // 🔥 SYNC QR FROM PROPS ON EACH OPEN
  // (чтобы при новом открытии брать актуальное значение)
  // ===============================
  useEffect(() => {
    if (!open) return;
    setQrPlaced(onboardingChecks?.qr_placed === true);
  }, [open, onboardingChecks]);

  useEffect(() => {
    if (!open) return;

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        refreshChecklist();
      }
    }

    function handleFocus() {
      refreshChecklist();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [open, refreshChecklist]);

  // ===============================
  // 🔥 TOGGLE QR PLACED (MANUAL)
  // ===============================
  async function toggleQrPlaced() {
    setSaving(true);

    const newValue = !qrPlaced;

    const { error } = await supabase
      .from("employers")
      .update({
        onboarding_checks: {
          ...onboardingChecks,
          qr_placed: newValue,
        },
      })
      .eq("user_id", employerId);

    if (error) {
      console.error("toggleQrPlaced error:", error);
      setSaving(false);
      return;
    }

    setQrPlaced(newValue);
    setSaving(false);
    setQrPlaced(newValue);
    onRefreshProfile();
  }

  const payoutsRequired = paymentAccountMode !== "team_only";

  const allDone =
  personalDetailsDone &&
  profilePhotoDone &&
  employeesDone &&
  schemeDone &&
  qrPlaced &&
  (!payoutsRequired || payoutsDone);

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
            onClick={() => {
              setOpen(false);
              onNavigate("overview");
            }}
          />

          <ChecklistItem
            label={t("onboarding_profile_photo")}
            done={profilePhotoDone}
            onClick={() => {
              setOpen(false);
              onNavigate("mypage");
            }}
          />

          <ChecklistItem
            label={t("onboarding_add_employees")}
            done={employeesDone}
            loading={loadingEmployees}
            onClick={() => {
              setOpen(false);
              onNavigate("employees");
            }}
          />

          <ChecklistItem
            label={t("onboarding_scheme_created")}
            done={schemeDone}
            loading={loadingSchemes}
            onClick={() => {
              setOpen(false);
              onNavigate("schemes");
            }}
          />

          <ChecklistItem
            label={t("onboarding_qr_placed")}
            done={qrPlaced}
            manual
            onClick={toggleQrPlaced}
            disabled={saving}
          />

          {payoutsRequired && (
            <ChecklistItem
              label={t("onboarding_payouts_enabled")}
              done={payoutsDone}
              onClick={() => {
                setOpen(false);
                onNavigate("stripe");
              }}
            />
          )}
          {canInstall && !isInstalled && (
            <ChecklistItem
              label={t("onboarding_install_app")}
              done={false}
              onClick={install}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ===============================
// UI ITEM
// ===============================
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
      <div className="flex items-center justify-between gap-3 text-slate-400">
        <span>{label}</span>
        <Circle size={18} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        onClick && !disabled ? "cursor-pointer hover:bg-slate-50 px-1 rounded" : ""
      }`}
      onClick={!disabled ? onClick : undefined}
    >
      <span className="text-slate-800">{label}</span>

      {done ? (
        <CheckCircle size={18} className="text-green-600" />
      ) : (
        <Circle
          size={18}
          className={
            manual ? "text-slate-500 hover:text-green-600" : "text-slate-300"
          }
        />
      )}
    </div>
  );
}
