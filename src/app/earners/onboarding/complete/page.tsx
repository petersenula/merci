'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckmarkAnimation } from '@/components/CheckmarkAnimation';
import { registrationSuccess } from '@/locales/registrationSuccess';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useT } from '@/lib/translation';
import { openInBrowser } from '@/lib/openInBrowser';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const lang = (params.get("lang") || "de") as keyof typeof registrationSuccess;
  const { t } = useT();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // 1️⃣ ждём Supabase session
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) break;
        await new Promise((r) => setTimeout(r, 300));
      }

      if (cancelled) return;

      // 2️⃣ небольшая пауза для UX
      await new Promise((r) => setTimeout(r, 1200));
      if (cancelled) return;

      // 3️⃣ пробуем автоматический переход
      router.replace(`/earners/profile?lang=${lang}`);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, supabase, lang]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6 px-4 text-center">
      <CheckmarkAnimation />

      <p className="text-2xl font-semibold text-green-600">
        {t("onboarding_complete_title")}
      </p>

      {/* 👇 Fallback CTA — ВСЕГДА ВИДЕН */}
      <p className="text-sm text-slate-600 max-w-xs">
        {t("onboarding_complete_manual_hint")}
      </p>

      <button
        onClick={() =>
          openInBrowser(`${window.location.origin}/earners/profile?lang=${lang}`)
        }
        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium"
      >
        {t("onboarding_complete_open_browser_button")}
      </button>
    </div>
  );
}
