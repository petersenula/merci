"use client";

import { useT } from "@/lib/translation";
import TipPreview from "../TipPreview";
import { useLandingTipPreview } from "../useLandingTipPreview";
import { useLandingPreviewStory } from "../useLandingPreviewStory";
import Button from '@/components/ui/button';
import { useEffect, useState } from "react";

export default function HeroSection() {
  const { t } = useT();
  const { data: preview, loading } = useLandingTipPreview();
  const { data: rows } = useLandingTipPreview();
  const storyFrame = useLandingPreviewStory(rows);
  const subtitles = [
    t("hero_subtitle_1"),
    t("hero_subtitle_2"),
    t("hero_subtitle_3"),
  ];

  const [subtitleIndex, setSubtitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="w-full min-h-[90vh] flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-16 gap-12">

      {/* LEFT — TEXT */}
      <div className="flex flex-col max-w-xl gap-6 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-slate-900">
          {t("hero_title")}
        </h1>
        <p
          key={subtitleIndex}
          className="text-lg text-slate-600 animate-fadeIn"
        >
          {subtitles[subtitleIndex]}
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
          <Button
            variant="green"
            className="px-6 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition"
            onClick={() => {
              window.location.href = "/signup";
            }}
          >
            {t("hero_cta")}
          </Button>
        </div>
        <p className="text-sm text-foreground/60">
          {t("hero_free_hint")}
        </p>
      </div>

      {/* RIGHT — PREVIEW */}
      <div className="w-full md:w-[480px] flex justify-center">
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
  );
}
