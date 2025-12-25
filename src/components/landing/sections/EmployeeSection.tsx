"use client";

import Image from "next/image";
import { useT } from "@/lib/translation";
import Button from "@/components/ui/button";
import { useLandingQrScenes } from "../useLandingQrScenes";
import { useEffect, useState } from "react";

export default function EmployeeSection() {
  const { t } = useT();
  const { data: qrScenes } = useLandingQrScenes()
  const { lang } = useT();

  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    if (!qrScenes.length) return;

    const id = setInterval(() => {
      setSceneIndex((i) => (i + 1) % qrScenes.length);
    }, 5000);

    return () => clearInterval(id);
  }, [qrScenes]);

  const currentScene = qrScenes[sceneIndex];

  const sceneTitle =
    currentScene?.[`title_${lang}`] ||
    currentScene?.title_en ||
    "";

  return (
    <section className="w-full px-6 md:px-16 py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        
        {/* LEFT — TEXT */}
        <div className="flex flex-col gap-8">
          <div className="max-w-xl">
            {/* LABEL */}
            <div className="inline-block mb-3 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium uppercase tracking-wide">
              {t("for_individuals")}
            </div>

            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-slate-900">
              {t("landing_individuals_title")}
            </h2>

            <p className="text-lg text-slate-600">
              {t("landing_individuals_subtitle")}
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-slate-700">
            <li>✔ {t("landing_individuals_benefit_1")}</li>
            <li>✔ {t("landing_individuals_benefit_2")}</li>
            <li>✔ {t("landing_individuals_benefit_3")}</li>
          </ul>
        </div>

        {/* RIGHT — QR SCENE */}
        {currentScene && (
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="relative h-[360px] rounded-xl overflow-hidden">
                <Image
                  key={sceneIndex}
                  src={currentScene.image_url}
                  alt=""
                  fill
                  className="object-contain transition-opacity duration-700"
                />
              </div>

              {sceneTitle && (
                <p className="mt-3 text-sm text-slate-500 text-center">
                  {sceneTitle}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-center mt-12">
        <Button
          variant="green"
          className="px-8 py-3 rounded-xl text-lg font-medium hover:opacity-90 transition"
          onClick={() => {
            window.location.href = "/signup";
          }}
        >
          {t("how_cta")}
        </Button>
      </div>
    </section>
  );
}
