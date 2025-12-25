"use client";

import { useT } from "@/lib/translation";
import { QrCode, CreditCard, FileText } from "lucide-react";
import Button from "@/components/ui/button";

const steps = [
  {
    icon: FileText,
    titleKey: "how_step1_title",
    textKey: "how_step1_text",
  },
  {
    icon: QrCode,
    titleKey: "how_step2_title",
    textKey: "how_step2_text",
  },
  {
    icon: CreditCard,
    titleKey: "how_step3_title",
    textKey: "how_step3_text",
  },
];

export default function HowItWorksSection() {
  const { t } = useT();

  return (
    <div id="how" className="w-full px-6 md:px-16 py-24 bg-background">
      <div className="max-w-6xl mx-auto flex flex-col gap-16">

        {/* TITLE */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            {t("how_title")}
          </h2>
          <p className="text-lg text-foreground/70">
            {t("how_subtitle")}
          </p>
        </div>

        {/* STEPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, i) => {
            const Icon = step.icon;

            return (
              <div
                key={i}
                className="flex flex-col items-center text-center gap-4 px-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-green-600" />
                </div>

                <h3 className="text-lg font-semibold">
                  {t(step.titleKey)}
                </h3>

                <p className="text-sm text-foreground/70 leading-relaxed">
                  {t(step.textKey)}
                </p>
              </div>
            );
          })}
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
    </div>
  );
}
