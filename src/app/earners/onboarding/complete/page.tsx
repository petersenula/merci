'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckmarkAnimation } from '@/components/CheckmarkAnimation';
import { registrationSuccess } from '@/locales/registrationSuccess';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClientComponentClient();

  const lang = (params.get("lang") || "de") as keyof typeof registrationSuccess;

  useEffect(() => {
    let cancelled = false;

    const waitForSessionAndRedirect = async () => {
      // пробуем до 10 раз (≈3 секунды)
      for (let i = 0; i < 10; i++) {
        if (cancelled) return;

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // всё готово → профиль
          router.replace('/earners/profile');
          return;
        }

        // ждём 300мс и пробуем снова
        await new Promise((r) => setTimeout(r, 300));
      }

      // даже если сессия не успела — отправим в профиль,
      // а профиль сам догрузится
      router.replace('/earners/profile');
    };

    waitForSessionAndRedirect();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
      <CheckmarkAnimation />

      <p className="text-2xl font-semibold text-green-600">
        {registrationSuccess[lang] || registrationSuccess.de}
      </p>
    </div>
  );
}
