"use client";

import { useEffect, useState } from "react";
import { useLandingDistributionSchemes } from "../useLandingDistributionSchemes";
import { useT } from "@/lib/translation";
import SchemePreview from "../SchemePreview";
import Button from "@/components/ui/button";
import {
  SlidersHorizontal,
  Users,
  ChartNoAxesCombined,
  FileText,
  Star,
  Workflow,
} from "lucide-react";

const ROTATE_MS = 4000;

type Lang = "en" | "de" | "fr" | "it";

function pickLocalizedField(
  row: Record<string, unknown>,
  base: string,
  lang: Lang
): string {
  const localized = row[`${base}_${lang}`];
  const fallback = row[base];
  return typeof localized === "string" && localized
    ? localized
    : typeof fallback === "string"
      ? fallback
      : "";
}

export default function EmployerSection() {
  const { t, lang } = useT();
  const safeLang: Lang = ["en", "de", "fr", "it"].includes(lang)
    ? (lang as Lang)
    : "en";

  const { data = [] } = useLandingDistributionSchemes("employer");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!data.length) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % data.length),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, [data.length]);

  const scheme = data[index % (data.length || 1)];

  const benefits = [
    {
      icon: SlidersHorizontal,
      title: t("teams_benefit1_title"),
      text: t("teams_benefit1_text"),
    },
    {
      icon: Users,
      title: t("teams_benefit2_title"),
      text: t("teams_benefit2_text"),
    },
    {
      icon: ChartNoAxesCombined,
      title: t("teams_benefit3_title"),
      text: t("teams_benefit3_text"),
    },
    {
      icon: FileText,
      title: t("teams_benefit4_title"),
      text: t("teams_benefit4_text"),
    },
  ];

  return (
    <section className="w-full px-6 md:px-16 py-24 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* LEFT — TEAM BENEFITS */}
        <div className="flex flex-col gap-7">
          <div>
            <div className="inline-block mb-3 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium uppercase tracking-wide">
              {t("for_teams")}
            </div>

            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-slate-900">
              {t("teams_title")}
            </h2>

            <p className="text-lg text-slate-600">
              {t("teams_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col gap-2"
                >
                  <Icon className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-slate-900">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {benefit.text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CUSTOMER FEEDBACK */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-green-600 shrink-0" />
              <h3 className="font-semibold text-slate-900">
                {t("teams_feedback_title")}
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("teams_feedback_text")}
            </p>
          </div>

          {/* FLEXIBLE SCHEMES */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Workflow className="w-6 h-6 text-green-600 shrink-0" />
              <h3 className="font-semibold text-slate-900">
                {t("teams_schemes_title")}
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("teams_schemes_text")}
            </p>
          </div>

          {/* REGISTRATION */}
          <div className="flex flex-col items-center text-center gap-2">
            <Button
              variant="green"
              className="px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition"
              onClick={() => {
                window.location.href = "/signup";
              }}
            >
              {t("teams_cta")}
            </Button>
            <p className="text-sm text-slate-500">
              {t("teams_cta_caption")}
            </p>
          </div>
        </div>

        {/* RIGHT — DISTRIBUTION SCHEMES FROM SUPABASE */}
        <div className="w-full flex justify-center">
          {scheme && (
            <div className="w-full max-w-[520px]">
              <SchemePreview
                key={`${scheme.id}-${safeLang}`}
                src={pickLocalizedField(scheme, "image_url", safeLang)}
                alt={pickLocalizedField(scheme, "title", safeLang)}
              />
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
