"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useT } from "@/lib/translation";

type Props = {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  showRules?: boolean;
};

export function PasswordField({
  label,
  value,
  onChange,
  showRules = false,
}: Props) {
  const { t } = useT();
  const [visible, setVisible] = useState(false);

  const safeValue = value ?? "";

  const rules = {
    has8: safeValue.length >= 8,
    hasUpper: /[A-Z]/.test(safeValue),
    hasLower: /[a-z]/.test(safeValue),
    hasDigit: /\d/.test(safeValue),
  };

  const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <Check size={16} className="text-green-600" />
      ) : (
        <X size={16} className="text-red-500" />
      )}

      <span className={ok ? "text-green-700" : "text-red-600"}>
        {text}
      </span>
    </div>
  );

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

      {showRules && safeValue.length > 0 && (
        <div className="space-y-1 mt-1 pl-1">
          <p className="text-xs font-medium text-slate-600 mb-1">
            {t("password_rules_title")}
          </p>

          <Rule ok={rules.has8} text={t("password_rule_8chars")} />
          <Rule ok={rules.hasUpper} text={t("password_rule_upper")} />
          <Rule ok={rules.hasLower} text={t("password_rule_lower")} />
          <Rule ok={rules.hasDigit} text={t("password_rule_digit")} />
        </div>
      )}
    </div>
  );
}
