'use client';

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/translation";
import Button from '@/components/ui/button';

export default function ForgotPasswordModal({
  open,
  onClose,
  onSubmit,
  initialEmail = "",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  initialEmail?: string;
}) {
  const { t } = useT();
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">
          {t("signin_forgot_title")}
        </h2>

        <p className="text-sm text-slate-600 text-center mb-4">
          {t("signin_forgot_subtitle")}
        </p>

        {/* Email field */}
        <label className="block text-sm font-medium mb-1">
          {t("signin_email")}
        </label>
        <input
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4"
        />

        {/* Buttons */}
        <div className="flex flex-col space-y-3 mt-4">
          <Button
          variant="green"
          onClick={() => onSubmit(email)}
          className="w-full py-2 rounded-lg text-sm font-medium"
          >
          {t('signin_forgot_submit')}
          </Button>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-50"
          >
            {t("signin_cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
