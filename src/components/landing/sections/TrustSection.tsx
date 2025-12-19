"use client";

import { useT } from "@/lib/translation";
import { ShieldCheck, Landmark, BadgeCheck, Banknote } from "lucide-react";

const items = [
  { icon: Landmark, titleKey: "trust_1_title", textKey: "trust_1_text" },
  { icon: BadgeCheck, titleKey: "trust_2_title", textKey: "trust_2_text" },
  { icon: Banknote, titleKey: "trust_3_title", textKey: "trust_3_text" },
  { icon: ShieldCheck, titleKey: "trust_4_title", textKey: "trust_4_text" },
];

export default function TrustSection() {
  const { t } = useT();

  return (
    <div className="w-full px-6 md:px-16 py-24 bg-background">
      <div className="max-w-6xl mx-auto flex flex-col gap-14">

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            {t("trust_title")}
          </h2>
          <p className="text-lg text-foreground/70">
            {t("trust_subtitle")}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-6 flex flex-col gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-green-600" />
                </div>

                <div className="font-semibold text-base">
                  {t(it.titleKey)}
                </div>

                <div className="text-sm text-foreground/70 leading-relaxed">
                  {t(it.textKey)}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <button
            onClick={() => (window.location.href = "/signup")}
            className="px-8 py-3 rounded-xl bg-green-600 text-white text-lg font-medium hover:opacity-90 transition"
          >
            {t("trust_cta")}
          </button>
        </div>
      </div>
    </div>
  );
}
