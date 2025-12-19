'use client';

import { useT } from "@/lib/translation";

type Props = {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export function PersonalInfo({ email, firstName, lastName }: Props) {
  const { t } = useT();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">
        {t("personal.title")}
      </h3>

      {/* Email */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          {t("personal.email")}
        </label>
        <input
          type="text"
          value={email ?? ""}
          disabled
          className="w-full border border-slate-300 bg-slate-100 text-slate-600 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
        />
      </div>

      {/* First name */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          {t("personal.firstName")}
        </label>
        <input
          type="text"
          value={firstName ?? ""}
          disabled
          className="w-full border border-slate-300 bg-slate-100 text-slate-600 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
        />
      </div>

      {/* Last name */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          {t("personal.lastName")}
        </label>
        <input
          type="text"
          value={lastName ?? ""}
          disabled
          className="w-full border border-slate-300 bg-slate-100 text-slate-600 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
        />
      </div>

      <p className="text-xs text-slate-500 leading-snug">
        {t("personal.note")}
      </p>
    </div>
  );
}
