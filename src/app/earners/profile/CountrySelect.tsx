"use client";

import { useState } from "react";
import { useT } from "@/lib/translation";

type CountryOption = {
  code: string;
  name: string;
};

const COUNTRIES: CountryOption[] = [
  { code: "CH", name: "Switzerland" },
  { code: "LI", name: "Liechtenstein" },
];

type Props = {
  value: string;
  onChange: (newValue: string) => void;
};

export function CountrySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useT();

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{t("country")}</label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-left text-sm bg-white"
        >
          {COUNTRIES.find((c) => c.code === value)?.name ||
            t("profile.selectCountry")}
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {COUNTRIES.map((country) => (
              <div
                key={country.code}
                onClick={() => {
                  onChange(country.code);
                  setOpen(false);
                }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 ${
                  country.code === value ? "bg-slate-50 font-medium" : ""
                }`}
              >
                {country.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
