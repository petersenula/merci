"use client";

import Link from "next/link";
import { useT } from "@/lib/translation";
import { AD_CONSENT_OPEN_EVENT } from "@/lib/analytics/adConsent";

export default function Footer() {
  const { t, lang } = useT();
  const cookieSettingsLabel: Record<string, string> = {
    de: "Cookie-Einstellungen",
    en: "Cookie settings",
    fr: "Paramètres des cookies",
    it: "Impostazioni cookie",
  };

  const storiesHref =
    lang === "de"
      ? "/stories/de"
      : lang === "fr"
        ? "/stories/fr"
        : lang === "it"
          ? "/stories/it"
          : "/stories";

  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-6 md:px-16 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-foreground/70">

        {/* LEFT */}
        <div>
          © {new Date().getFullYear()} {t("footer_company_name")}
        </div>

        {/* RIGHT */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">
            {t("terms_title")}
          </Link>

          <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">
            {t("privacy_title")}
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(AD_CONSENT_OPEN_EVENT))}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            {cookieSettingsLabel[lang] ?? cookieSettingsLabel.en}
          </button>
          <Link
            href="/how-it-works"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            {t("how_it_works_nav")}
          </Link>

          <Link
            href={storiesHref}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            {t("stories_nav")}
          </Link>

          <Link
              href="/support"
              className="hover:text-foreground underline-offset-4 hover:underline"
          >
              {t("support_title")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
