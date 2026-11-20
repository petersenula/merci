"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/translation";
import {
  AD_CONSENT_CHANGED_EVENT,
  AD_CONSENT_OPEN_EVENT,
  getAdConsent,
  saveAdConsent,
  type AdConsentChoice,
} from "@/lib/analytics/adConsent";

const translations = {
  de: {
    title: "Hilf uns, mehr Trinkgeld zu retten! 💚",
    description: "Wir machen Werbung für Click4Tip, damit weniger Trinkgeld verloren geht. Mit deiner Zustimmung können wir über Google Ads sehen, ob unsere Werbung etwas bringt – oder ob wir unser Werbebudget zum Fenster hinauswerfen. 😉 Wir verkaufen deine Daten nicht und verwenden sie nicht, um Werbung für dich zu personalisieren. Du kannst jederzeit Nein sagen oder deine Meinung ändern.",
    accept: "Ja, ich helfe mit! 💚",
    reject: "Nein, danke",
    privacy: "Datenschutzerklärung",
  },
  en: {
    title: "Help us save more tips! 💚",
    description: "We advertise Click4Tip so fewer tips go uncollected. With your consent, Google Ads helps us see whether our ads work – or whether we're throwing our advertising budget out the window. 😉 We don't sell your data or use it to personalize ads for you. You can say no or change your mind anytime.",
    accept: "Yes, I'll help! 💚",
    reject: "No, thanks",
    privacy: "Privacy Policy",
  },
  fr: {
    title: "Aide-nous à sauver plus de pourboires ! 💚",
    description: "Nous faisons connaître Click4Tip pour que moins de pourboires soient perdus. Avec ton accord, Google Ads nous aide à savoir si nos publicités fonctionnent – ou si nous jetons notre budget publicitaire par les fenêtres. 😉 Nous ne vendons pas tes données et ne les utilisons pas pour personnaliser les publicités. Tu peux refuser ou changer d'avis à tout moment.",
    accept: "Oui, je vous aide ! 💚",
    reject: "Non, merci",
    privacy: "Politique de confidentialité",
  },
  it: {
    title: "Aiutaci a salvare più mance! 💚",
    description: "Facciamo conoscere Click4Tip affinché meno mance vadano perse. Con il tuo consenso, Google Ads ci aiuta a capire se la nostra pubblicità funziona – o se stiamo buttando il budget pubblicitario dalla finestra. 😉 Non vendiamo i tuoi dati e non li usiamo per personalizzare gli annunci. Puoi rifiutare o cambiare idea in qualsiasi momento.",
    accept: "Sì, vi aiuto! 💚",
    reject: "No, grazie",
    privacy: "Informativa sulla privacy",
  },
};

export default function AdConsentBanner() {
  const { lang } = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const refresh = () => setVisible(getAdConsent() === null);
    refresh();
    const open = () => setVisible(true);
    window.addEventListener(AD_CONSENT_CHANGED_EVENT, refresh);
    window.addEventListener(AD_CONSENT_OPEN_EVENT, open);
    return () => {
      window.removeEventListener(AD_CONSENT_CHANGED_EVENT, refresh);
      window.removeEventListener(AD_CONSENT_OPEN_EVENT, open);
    };
  }, []);

  const copy = translations[lang as keyof typeof translations] ?? translations.en;

  const choose = (choice: AdConsentChoice) => {
    if (saveAdConsent(choice)) setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      role="dialog"
      aria-label={copy.title}
      aria-modal="false"
      className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-xl rounded-xl border border-border bg-background p-5 shadow-xl"
    >
      <h2 className="mb-2 text-base font-semibold text-foreground">{copy.title}</h2>
      <p className="mb-3 text-sm text-foreground/80">{copy.description}</p>
      <Link href="/privacy" className="text-sm underline text-foreground">
        {copy.privacy}
      </Link>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => choose("rejected")}
          className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-foreground"
        >
          {copy.reject}
        </button>
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-foreground"
        >
          {copy.accept}
        </button>
      </div>
    </aside>
  );
}
