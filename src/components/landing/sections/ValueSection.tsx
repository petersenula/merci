"use client";

import { useT } from "@/lib/translation";
import Button from "@/components/ui/button";

export default function ValueSection() {
  const { t } = useT();

  const reasons = [
    {
      title: t("landing_value_reason_cashless_title"),
      text: t("landing_value_reason_cashless_text"),
    },
    {
      title: t("landing_value_reason_comfort_title"),
      text: t("landing_value_reason_comfort_text"),
    },
    {
      title: t("landing_value_reason_flexible_title"),
      text: t("landing_value_reason_flexible_text"),
    },
    {
      title: t("landing_value_reason_personal_title"),
      text: t("landing_value_reason_personal_text"),
    },
  ];

  return (
    <section id="value" className="w-full px-6 md:px-16 py-24 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">

        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">
            {t("landing_value_title")}
          </h2>
          <p className="text-lg text-slate-600">
            {t("landing_value_subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reasons.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="text-slate-600">
                {item.text}
              </p>
            </div>
          ))}
        </div>
        {/* CTA */}
        <div className="flex justify-center">
          <Button variant="green"
            onClick={() => (window.location.href = "/signup")}
            className="px-8 py-3 rounded-xl bg-green-600 text-white text-lg font-medium hover:opacity-90 transition"
          >
            {t("how_cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}
