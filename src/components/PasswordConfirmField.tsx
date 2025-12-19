"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useT } from "@/lib/translation";

type Props = {
  label: string;
  value?: string;              // ← допускаем undefined
  compareTo?: string;          // ← допускаем undefined
  onChange: (v: string) => void;
};

export function PasswordConfirmField({
  label,
  value,
  compareTo,
  onChange
}: Props) {
  const { t } = useT();
  const [visible, setVisible] = useState(false);

  // 🔥 безопасные строки
  const safeValue = value ?? "";
  const safeCompare = compareTo ?? "";

  const matches =
    safeValue.length > 0 && safeValue === safeCompare;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1">{label}</label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm"
        />

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {safeValue.length > 0 && (
        <div className="flex items-center gap-2 text-sm pl-1">
          {matches ? (
            <Check size={16} className="text-green-600" />
          ) : (
            <X size={16} className="text-red-500" />
          )}

          <span className={matches ? "text-green-700" : "text-red-600"}>
            {t("password_rule_match")}
          </span>
        </div>
      )}
    </div>
  );
}
