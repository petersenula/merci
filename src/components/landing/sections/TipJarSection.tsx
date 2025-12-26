"use client";

import { useT } from "@/lib/translation";
import LivePreviewPlayer from "@/components/landing/LivePreviewPlayer";

export default function TipJarSection() {
  const { t } = useT();

  return (
    <div className="w-full px-6 md:px-16 py-24 bg-background">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

        {/* TEXT */}
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight">
            {t("tipjar_title")}
          </h2>

          <p className="text-lg text-foreground/70">
            {t("tipjar_subtitle")}
          </p>

          <ul className="flex flex-col gap-4">
            <li className="text-base text-foreground/80">
              • {t("tipjar_point_1")}
            </li>
            <li className="text-base text-foreground/80">
              • {t("tipjar_point_2")}
            </li>
            <li className="text-base text-foreground/80">
              • {t("tipjar_point_3")}
            </li>
            <li className="text-base text-foreground/80">
              • {t("tipjar_point_4")}
            </li>
          </ul>

          <div className="pt-4">
            <button
              onClick={() => (window.location.href = "/signup")}
              className="px-8 py-3 rounded-xl bg-green-600 text-white text-lg font-medium hover:opacity-90 transition"
            >
              {t("tipjar_cta")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
