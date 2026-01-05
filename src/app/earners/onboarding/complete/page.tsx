'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckmarkAnimation } from '@/components/CheckmarkAnimation';
import { registrationSuccess } from '@/locales/registrationSuccess';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function OnboardingCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const lang = (params.get("lang") || "de") as keyof typeof registrationSuccess;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // 1️⃣ ждём Supabase session (после Stripe)
      for (let i = 0; i < 10; i++) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) break;
        await new Promise((r) => setTimeout(r, 300));
      }

      if (cancelled) return;

      // 2️⃣ показываем success сообщение 2 секунды
      await new Promise((r) => setTimeout(r, 2000));

      if (cancelled) return;

      // 3️⃣ ВСЕГДА переходим в профиль
      router.replace(`/earners/profile?lang=${lang}`);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, supabase, lang]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
      <CheckmarkAnimation />

      <p className="text-2xl font-semibold text-green-600">
        {registrationSuccess[lang] || registrationSuccess.de}
      </p>
    </div>
  );
}
