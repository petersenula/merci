"use client";

import { useT } from "@/lib/translation";
import HeroPhoneSlideshow from "../HeroPhoneSlideshow";
import Button from '@/components/ui/button';
import HeroParallaxBackground from "./HeroParallaxBackground";
import { useScroll } from "../ScrollContext";
import { trackEvent } from "@/lib/analytics/trackEvent";

export default function HeroSection() {
  const { t } = useT();
  const { scrollTo } = useScroll();
  return (
    <div className="relative overflow-hidden">
      <HeroParallaxBackground />

      <div className="w-full min-h-[90vh] flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-16 gap-12">

        {/* LEFT — TEXT */}
        <div className="flex flex-col max-w-xl gap-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-slate-900">
            {t("hero_title")}
          </h1>
          <p className="text-xl md:text-2xl text-slate-700">
            {t("hero_subtitle_1")}
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-lg font-semibold text-slate-900">
              {t("hero_subtitle_2")}
            </p>
            <p className="text-lg text-slate-600">
              {t("hero_subtitle_3")}
            </p>
          </div>
          <div className="flex flex-col gap-4 justify-center md:justify-start">
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                variant="green"
                className="px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition"
                onClick={() => {
                  trackEvent("signup_click", "hero");
                  window.location.href = "/signup";
                }}
              >
                {t("hero_cta")}
              </Button>
            </div>

            {/* QUICK LINKS */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-2">
              {([
                { id: "how", key: "how_title" },
                { id: "features", key: "why_its_secure" },
                { id: "flexibility", key: "flex_nav" },
                { id: "value", key: "why_tips_grow" },
                { id: "individuals", key: "for_individuals" },
                { id: "teams", key: "for_teams" },
                { id: "faq", key: "faq_title" },
              ] as const).map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="px-3 py-1.5 rounded-full border border-slate-200 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                >
                  {item.id === "faq" ? "FAQ" : t(item.key)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-foreground/60">
            {t("hero_free_hint")}
          </p>
        </div>

        {/* RIGHT — PREVIEW */}
        <div className="w-full md:w-[480px] flex justify-center">
          <div className="w-full max-w-[480px] h-[680px] flex items-center justify-center animate-fadeInUp">
            <HeroPhoneSlideshow />
          </div>
        </div>
      </div>
    </div>
  );
}
