"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useT } from "@/lib/translation";

const languages = ["de", "en", "fr", "it"] as const;
type HeroLanguage = (typeof languages)[number];

function normalizeLanguage(value: string): HeroLanguage {
  return languages.includes(value as HeroLanguage)
    ? (value as HeroLanguage)
    : "de";
}

export default function HeroPhoneSlideshow() {
  const { lang } = useT();
  const language = normalizeLanguage(lang);
  const [frame, setFrame] = useState(0);
  const [activeLanguage, setActiveLanguage] = useState(language);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (activeLanguage !== language) {
      setActiveLanguage(language);
      setFrame(0);
    }
  }, [language, activeLanguage]);

  useEffect(() => {
    if (reducedMotion) return;

    const timer = window.setTimeout(
      () => setFrame((current) => (current + 1) % 3),
      frame === 0 ? 2500 : frame === 1 ? 3000 : 2000
    );

    return () => window.clearTimeout(timer);
  }, [frame, activeLanguage, reducedMotion]);

  const visibleFrame = activeLanguage === language ? frame : 0;

  return (
    <div className="relative w-full max-w-[480px] aspect-[1024/1536] mx-auto">
      {[1, 2, 3].map((number, index) => (
        <Image
          key={`${language}-${number}`}
          src={`/images/hero/${number}_${language}.png`}
          alt={`Click4Tip — ${number === 1 ? "tip" : number === 2 ? "payment" : "confirmation"}`}
          fill
          sizes="(max-width: 768px) 90vw, 480px"
          priority={number === 1}
          className={`object-contain transition-opacity duration-500 ${
            visibleFrame === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={visibleFrame !== index}
        />
      ))}
    </div>
  );
}
