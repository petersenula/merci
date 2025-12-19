'use client';

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import PaymentPreview from "@/components/PaymentPreview";
import { useT } from "@/lib/translation";

type Props = {
  open: boolean;
  onClose: () => void;
  profile: any; // сюда приходит объект из details API
};

export default function EmployeePayPageModal({ open, onClose, profile }: Props) {
  const [readonlyProfile, setReadonlyProfile] = useState<any>(null);
  const { t } = useT();

  // берём данные работника из details
  useEffect(() => {
    if (!profile) return;
    setReadonlyProfile(profile.profiles_earner);
  }, [profile]);

  if (!open || !readonlyProfile) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">

        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <X size={22} />
        </button>

        <h2 className="text-lg font-semibold mb-4 text-center">
         {t("employee_pay_page_title")}  
        </h2>

          {/* ВАЖНО: делаем ProfileMyPage неинтерактивным */}
          <div className="pointer-events-none opacity-90">
            <PaymentPreview
            name={readonlyProfile.display_name}
            avatar={readonlyProfile.avatar_url}
            goalTitle={readonlyProfile.goal_title}
            goalAmountCents={readonlyProfile.goal_amount_cents}
            goalStartAmount={readonlyProfile.goal_start_amount ?? 0}
            goalEarnedSinceStart={0}   // если понадобятся real данные — скажи
            currency={readonlyProfile.currency || "CHF"}
            />
        </div>
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
