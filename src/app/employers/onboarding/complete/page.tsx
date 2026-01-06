'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckmarkAnimation } from '@/components/CheckmarkAnimation';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import LoaderOverlay from '@/components/ui/LoaderOverlay';
import { useT } from '@/lib/translation';

function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    ua.includes('wv') ||                 // Android WebView
    ua.includes('SamsungBrowser') ||
    ua.includes('FBAN') ||
    ua.includes('FBAV') ||
    ua.includes('Instagram') ||
    ua.includes('Gmail')
  );
}

export default function EmployerOnboardingCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const { t } = useT();
  const lang = params.get("lang") || "de";

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // 1️⃣ ждём Supabase session (возврат со Stripe)
      for (let i = 0; i < 10; i++) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) break;
        await new Promise((r) => setTimeout(r, 300));
      }

      if (cancelled) return;

      // 2️⃣ показываем success 2 секунды
      await new Promise((r) => setTimeout(r, 2000));

      if (cancelled) return;

      // 3️⃣ ВСЕГДА идём в профиль работодателя
      useEffect(() => {
        let cancelled = false;

        const run = async () => {
          // 1️⃣ ждём Supabase session (возврат со Stripe)
          for (let i = 0; i < 10; i++) {
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (session?.user) break;
            await new Promise((r) => setTimeout(r, 300));
          }

          if (cancelled) return;

          // 2️⃣ показываем success 2 секунды
          await new Promise((r) => setTimeout(r, 2000));

          if (cancelled) return;

          // 3️⃣ если in-app браузер — НЕ редиректим автоматически
          if (isInAppBrowser()) {
            return;
          }

          // 4️⃣ нормальный браузер → идём в профиль
          router.replace(`/employers/profile?lang=${lang}`);
        };

        run();

        return () => {
          cancelled = true;
        };
      }, [router, supabase, lang]);
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [router, supabase, lang]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6 px-4 text-center">
      <LoaderOverlay show />
      <CheckmarkAnimation />

      <p className="text-xl font-semibold text-green-600">
        {t("onboarding_complete_title")}
      </p>

      {isInAppBrowser() && (
        <>
          <p className="text-sm text-slate-600">
            {t("onboarding_complete_open_browser_hint")}
          </p>

          <button
            onClick={() => {
              window.location.href = window.location.href;
            }}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium"
          >
            {t("onboarding_complete_open_browser_button")}
          </button>
        </>
      )}
    </div>
  );
}
