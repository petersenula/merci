"use client";

import { useT } from "@/lib/translation";
import Button from "@/components/ui/button";
import TipPreview from "../TipPreview";
import { useLandingTipPreview } from "../useLandingTipPreview";
import { useLandingPreviewStory } from "../useLandingPreviewStory";
import {
  UserRound,
  Users,
  Wallet,
  ChartNoAxesCombined,
  QrCode,
} from "lucide-react";

export default function EmployeeSection() {
  const { t } = useT();
  const { data: rows } = useLandingTipPreview();
  const storyFrame = useLandingPreviewStory(rows);

  const benefits = [
    {
      icon: UserRound,
      title: t("individuals_benefit1_title"),
      text: t("individuals_benefit1_text"),
    },
    {
      icon: Users,
      title: t("individuals_benefit2_title"),
      text: t("individuals_benefit2_text"),
    },
    {
      icon: Wallet,
      title: t("individuals_benefit3_title"),
      text: t("individuals_benefit3_text"),
    },
    {
      icon: ChartNoAxesCombined,
      title: t("individuals_benefit4_title"),
      text: t("individuals_benefit4_text"),
    },
  ];

  return (
    <section className="w-full px-6 md:px-16 py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* LEFT — BENEFITS AND REGISTRATION */}
        <div className="flex flex-col gap-7">
          <div>
            <div className="inline-block mb-3 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium uppercase tracking-wide">
              {t("for_individuals")}
            </div>

            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-slate-900">
              {t("individuals_title")}
            </h2>

            <p className="text-lg text-slate-600">
              {t("individuals_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="rounded-xl bg-white border border-slate-200 p-4 flex flex-col gap-2"
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

          <div className="rounded-xl bg-white border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <QrCode className="w-6 h-6 text-green-600 shrink-0" />
              <h3 className="font-semibold text-slate-900">
                {t("individuals_qr_title")}
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("individuals_qr_text")}
            </p>
          </div>

          <div className="flex flex-col items-center text-center gap-2">
            <Button
              variant="green"
              className="px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition"
              onClick={() => {
                window.location.href = "/signup";
              }}
            >
              {t("individuals_cta")}
            </Button>
            <p className="text-sm text-slate-500">
              {t("individuals_cta_caption")}
            </p>
          </div>
        </div>

        {/* RIGHT — ORIGINAL HERO TIP PREVIEW */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[480px] h-[680px] flex items-center justify-center animate-fadeInUp">
            {storyFrame && (
              <div className="scale-[0.8] origin-center">
                <TipPreview
                  name={storyFrame.row.name}
                  imageUrl={storyFrame.row.image_url ?? undefined}
                  goalTitle={storyFrame.row.goal_title ?? undefined}
                  goalAmountCents={storyFrame.row.goal_amount_cents ?? undefined}
                  goalStartAmountCents={0}
                  goalEarnedSinceStart={storyFrame.earnedCents}
                  currency={storyFrame.row.currency}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
