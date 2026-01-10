'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckmarkAnimation } from '@/components/CheckmarkAnimation';
import { registrationSuccess } from '@/locales/registrationSuccess';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useT } from '@/lib/translation';
import { usePWAInstall } from '@/lib/usePWAInstall';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const { t } = useT();
  const { openOrInstall, isInstalled } = usePWAInstall();

  const lang = (params.get("lang") || "de") as keyof typeof registrationSuccess;
  const [showBrowserHint, setShowBrowserHint] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // ⏱ 3 секунды — если редирект не случился, показываем инструкцию
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setShowBrowserHint(true);
      }
    }, 5000);

    const run = async () => {
      // 1️⃣ ждём Supabase session
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          clearTimeout(timeout);
          router.replace(`/earners/profile?lang=${lang}`);
          return;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
    };

    run();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [router, supabase, lang]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6 px-4 text-center">
      <CheckmarkAnimation />

      <p className="text-2xl font-semibold text-green-600">
        {t("onboarding_complete_title")}
      </p>

      {/* 🟡 Экран-инструкция, если редирект не произошёл */}
      {showBrowserHint && (
        <>
          <p className="text-sm text-slate-700 max-w-md">
            {t("onboarding_complete_open_browser_hint")}
          </p>

          {!isInstalled && (
            <>
              <p className="text-sm text-slate-600 max-w-md">
                {t("onboarding_complete_manual_hint")}
              </p>

              <button
                onClick={() => openOrInstall(window.location.origin)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium"
              >
                {t("onboarding_complete_download_app_button")}
              </button>
            </>
          )}

          {isInstalled && (
            <p className="text-sm text-slate-600 max-w-md">
              {t("signin_mobile_installed_hint")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
