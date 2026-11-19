"use client";

import { trackEvent } from "@/lib/analytics/trackEvent";

import { useState } from "react";
import { useT } from "@/lib/translation";
import { ChevronDown } from "lucide-react";
import Button from "@/components/ui/button";



export default function FAQSection() {
  const { t } = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const questions = Array.from({ length: 12 }, (_, i) => ({
    question: t(`faq_q${i + 1}`),
    answer: t(`faq_a${i + 1}`),
  }));

  return (
    <section id="faq" className="w-full px-6 md:px-16 py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="max-w-2xl">
          <div className="inline-block mb-3 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium uppercase tracking-wide">
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-slate-900">
            {t("faq_title")}
          </h2>
          <p className="text-lg text-slate-600">
            {t("faq_subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.question}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-medium text-slate-900">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center text-center gap-3">
          <Button
            variant="green"
            className="px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition"
            onClick={() => { trackEvent("signup_click", "faq"); window.location.href = "/signup"; }}
          >
            {t("faq_cta")}
          </Button>
          <p className="text-sm text-slate-500">
            {t("faq_cta_caption")}
          </p>
        </div>
      </div>
    </section>
  );
}
