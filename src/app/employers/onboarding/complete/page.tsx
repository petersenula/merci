'use client';

import { useEffect, useState } from 'react';
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
    ua.includes('FBAN') ||
    ua.includes('FBAV') ||
    ua.includes('Instagram') ||
    ua.includes('SamsungBrowser') ||
    ua.includes('Gmail')
  );
}

export default function EmployerOnboardingCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const { t } = useT();
  const lang = params.get("lang") || "de";

  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser());

    let cancelled = false;

    const run = async () => {
      // 1️⃣ ждём Supabase session
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) break;
        await new Promise((r) => setTimeout(r, 300));
      }

      if (cancelled) return;

      // 2️⃣ небольшая пауза
      await new Promise((r) => setTimeout(r, 1500));
      if (cancelled) return;

      // 3️⃣ если НЕ in-app → автоматический переход
      if (!isInAppBrowser()) {
        router.replace(`/employers/profile?lang=${lang}`);
      }
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

      {inApp && (
        <>
          <p className="text-sm text-slate-600">
            {t("onboarding_complete_open_browser_hint")}
          </p>

          {/* 🔥 ВАЖНО: target=_blank */}
          <a
            href={`${window.location.origin}/employers/profile?lang=${lang}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium"
          >
            {t("onboarding_complete_open_browser_button")}
          </a>
        </>
      )}
    </div>
  );
}
