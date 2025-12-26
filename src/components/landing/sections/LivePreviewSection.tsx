"use client";

import { useT } from "@/lib/translation";
import LivePreviewPlayer from "@/components/landing/LivePreviewPlayer";

export default function LivePreviewSection() {
  const { t } = useT();

  return (
    <section className="w-full px-6 md:px-16 py-24 bg-background">
      <div className="max-w-6xl mx-auto flex flex-col gap-16 items-center">

        {/* TEXT */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            {t("livepreview_title")}
          </h2>
          <p className="text-lg text-foreground/70">
            {t("livepreview_subtitle")}
          </p>
        </div>

        {/* PREVIEW */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-sm">
            <LivePreviewPlayer />
          </div>
        </div>

      </div>
    </section>
  );
}
