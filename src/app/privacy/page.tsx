"use client";

import { useT } from "@/lib/translation";
import { AD_CONSENT_OPEN_EVENT } from "@/lib/analytics/adConsent";

export default function PrivacyPage() {
  const { t, lang } = useT();
  const cookieSettingsLabel: Record<string, string> = {
    de: "Cookie-Einstellungen",
    en: "Cookie settings",
    fr: "Paramètres des cookies",
    it: "Impostazioni cookie",
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-4">{t("privacy_title")}</h1>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(AD_CONSENT_OPEN_EVENT))}
        className="mb-8 text-sm underline underline-offset-4 hover:text-foreground/70"
      >
        {cookieSettingsLabel[lang] ?? cookieSettingsLabel.en}
      </button>

      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <section key={n} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {t(`privacy_section_${n}_title`)}
          </h2>
          <div
            className="prose prose-neutral"
            dangerouslySetInnerHTML={{
              __html: t(`privacy_section_${n}_text`),
            }}
          />
        </section>
      ))}
    </main>
  );
}