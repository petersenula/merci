"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLandingDistributionSchemes } from "../useLandingDistributionSchemes";
import { useT } from "@/lib/translation";
import SchemeImage from "../SchemeImage";
import SchemePreview from "../SchemePreview";


const ROTATE_MS = 4000;

type Lang = "en" | "de" | "fr" | "it";

function pickLocalizedField<T extends string>(
  row: any,
  base: T,
  lang: Lang
): string {
  return (
    row[`${base}_${lang}`] ||
    row[base] ||
    ""
  );
}

function pickLocalized(
  row: any,
  field: "title" | "description",
  lang: string
) {
  return row[`${field}_${lang}`] || row[field] || "";
}

export default function EmployerSection() {
  const { t, lang } = useT();
  const safeLang: Lang = ["en", "de", "fr", "it"].includes(lang as Lang)
  ? (lang as Lang)
  : "en";
  const { data = [] } = useLandingDistributionSchemes("employer");
  const [index, setIndex] = useState(0);
  const scheme = data[index];

  useEffect(() => {
    if (!data.length) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % data.length),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, [data.length]);

  if (!scheme) return null;

  const title = pickLocalizedField(scheme, "title", safeLang);
  const description = pickLocalizedField(scheme, "description", safeLang);
  const imageUrl = pickLocalizedField(scheme, "image_url", safeLang);

  return (
    <section className="w-full px-6 md:px-16 py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto flex flex-col gap-16">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
  
          {/* LEFT COLUMN */}
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-slate-900">
              {t("landing_employer_title")}
            </h2>

            <p className="text-lg text-slate-600 mb-6">
              {t("landing_employer_subtitle")}
            </p>

            <div className="mb-8">
              <div className="text-sm text-slate-500 mb-3">
                {t("landing_employer_for_label")}
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  "landing_employer_industry_hospitality",
                  "landing_employer_industry_hotels",
                  "landing_employer_industry_beauty",
                  "landing_employer_industry_mobility",
                  "landing_employer_industry_trades",
                  "landing_employer_industry_care",
                  "landing_employer_industry_local"
                ].map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-sm text-slate-700"
                  >
                    {t(key)}
                  </span>
                ))}
              </div>
            </div>

            <ul className="space-y-2 text-slate-700">
              <li>✔ {t("landing_employer_benefit_schemes")}</li>
              <li>✔ {t("landing_employer_benefit_automatic")}</li>
              <li>✔ {t("landing_employer_benefit_transparent")}</li>
              <li>✔ {t("landing_employer_benefit_flexible")}</li>
              <li>✔ {t("landing_employer_benefit_accounting")}</li>
            </ul>
          </div>

          {/* RIGHT COLUMN */}
          <div className="relative">
            <SchemePreview
              key={`${scheme.id}-${safeLang}`}
              src={imageUrl}
              alt={title}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
