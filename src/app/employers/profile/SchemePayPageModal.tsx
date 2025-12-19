"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import PaymentPreview from "@/components/PaymentPreview";
import { useT } from "@/lib/translation";

type PreviewData = {
  name: string;
  avatar: string | null;

  goalTitle: string | null;
  goalAmountCents: number | null;
  goalStartAmount: number;
  goalEarnedSinceStart: number;
  currency: string;

  showGoal: boolean;
  showGoalAmount: boolean;
  showProgress: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;

  ownerProfile: {
    name: string;
    avatar: string | null;

    goalTitle: string | null;
    goalAmountCents: number | null;
    goalStartAmount: number;
    goalEarnedSinceStart: number;
    currency: string;
  };

  flags: {
    showGoal: boolean;
    showGoalAmount: boolean;
    showProgress: boolean;
  };
};

export default function SchemePayPageModal({
  open,
  onClose,
  ownerProfile,
  flags,
}: Props) {
  const { t } = useT();
  const [preview, setPreview] = useState<PreviewData | null>(null);

  // создаём read-only snapshot профиля + флагов
  useEffect(() => {
    if (!ownerProfile) return;

    setPreview({
      name: ownerProfile.name,
      avatar: ownerProfile.avatar,

      goalTitle: ownerProfile.goalTitle,
      goalAmountCents: ownerProfile.goalAmountCents,
      goalStartAmount: ownerProfile.goalStartAmount,
      goalEarnedSinceStart: ownerProfile.goalEarnedSinceStart,
      currency: ownerProfile.currency,

      showGoal: flags.showGoal ?? true,
      showGoalAmount: flags.showGoalAmount ?? true,
      showProgress: flags.showProgress ?? true,
    });
  }, [ownerProfile, flags]);

  if (!open || !preview) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">

        {/* close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <X size={22} />
        </button>

        {/* title */}
        <h2 className="text-lg font-semibold mb-4 text-center">
          {t("schemes_preview_modal_title")}
        </h2>

        {/* preview */}
        <div className="pointer-events-none opacity-90">
          <PaymentPreview
            name={preview.name}
            avatar={preview.avatar}
            goalTitle={preview.goalTitle}
            goalAmountCents={preview.goalAmountCents}
            goalStartAmount={preview.goalStartAmount}
            goalEarnedSinceStart={preview.goalEarnedSinceStart}
            currency={preview.currency}
            showGoal={preview.showGoal}
            showGoalAmount={preview.showGoalAmount}
            showProgress={preview.showProgress}
          />
        </div>

        {/* close footer */}
        <button
          onClick={onClose}
          className="mt-4 w-full bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-lg"
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
}
