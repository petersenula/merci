"use client";

import { trackEvent } from "@/lib/analytics/trackEvent";

import { useT } from "@/lib/translation";
import {
  Landmark,
  ChartNoAxesCombined,
  Wallet,
  Users,
  QrCode,
  CreditCard,
  Globe2,
} from "lucide-react";

export default function FlexibilitySection() {
  const { t } = useT();

  const recipientBenefits = [
    { icon: Landmark, title: "flex_bank_title", text: "flex_bank_text" },
    { icon: ChartNoAxesCombined, title: "flex_realtime_title", text: "flex_realtime_text" },
    { icon: Wallet, title: "flex_payout_title", text: "flex_payout_text" },
    { icon: Users, title: "flex_team_title", text: "flex_team_text" },
  ];

  const customerBenefits = [
    { icon: QrCode, title: "flex_scan_title", text: "flex_scan_text" },
    { icon: CreditCard, title: "flex_payment_title", text: "flex_payment_text" },
    { icon: Globe2, title: "flex_local_title", text: "flex_local_text" },
  ];

  return (
    <section className="w-full px-6 md:px-16 py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="max-w-2xl">
          <div className="inline-block mb-3 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium uppercase tracking-wide">
            {t("flex_label")}
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">
            {t("flex_title")}
          </h2>
          <p className="text-lg text-slate-600">{t("flex_subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 flex flex-col">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6">
              {t("flex_recipient_heading")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {recipientBenefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex flex-col gap-2">
                    <Icon className="w-6 h-6 text-green-600" />
                    <h4 className="font-semibold text-slate-900">{t(benefit.title)}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{t(benefit.text)}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto pt-8 flex flex-col items-center text-center">
              <a
                onClick={() => trackEvent("signup_click", "flexibility")} href="/signup"
                className="px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition inline-flex items-center justify-center text-center bg-[#1FB94A] text-white hover:bg-[#16963B]"
              >
                Create your personal tipping QR code
              </a>
              <p className="mt-3 text-sm text-slate-500 text-center">
                Start accepting digital tips with Click4Tip.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8">
            <h3 className="text-2xl font-semibold text-slate-900 mb-6">
              {t("flex_customer_heading")}
            </h3>
            <div className="flex flex-col gap-5">
              {customerBenefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex gap-3 items-start">
                    <Icon className="w-6 h-6 text-green-600 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900">{t(benefit.title)}</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{t(benefit.text)}</p>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mt-1">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Visa", file: "visa.svg" },
                    { name: "Mastercard", file: "mastercard.svg" },
                    { name: "Apple Pay", file: "applepay.svg" },
                    { name: "Google Pay", file: "googlepay.svg" },
                    { name: "TWINT", file: "twint.svg" },
                  ].map((method) => (
                    <div
                      key={method.name}
                      className="min-h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center px-3 py-3"
                    >
                      <img
                        src={`/images/payment-methods/${method.file}`}
                        alt={method.name}
                        className="w-full max-w-[110px] h-8 object-contain"
                        loading="lazy"
                      />
                    </div>
                  ))}
                  <div className="min-h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-600">
                    {t("flex_more_methods")}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  {t("flex_payment_note")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
