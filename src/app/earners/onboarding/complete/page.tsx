'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckmarkAnimation } from '@/components/CheckmarkAnimation';
import { registrationSuccess } from '@/locales/registrationSuccess';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { checkRegistrationStatus } from '@/lib/checkRegistrationStatus';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClientComponentClient();

  const lang = (params.get("lang") || "de") as keyof typeof registrationSuccess;

  useEffect(() => {
    let cancelled = false;

    const waitForSessionAndRedirect = async () => {
      // 1️⃣ ждём Supabase session
      for (let i = 0; i < 10; i++) {
        if (cancelled) return;

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) break;

        await new Promise((r) => setTimeout(r, 300));
      }

      if (cancelled) return;

      // 2️⃣ определяем статус регистрации
      const { status } = await checkRegistrationStatus();

      if (status === "earner_with_stripe") {
        router.replace('/earners/profile');
        return;
      }

      if (status === "earner_no_stripe") {
        router.replace('/earners/register');
        return;
      }

      if (status === "employer_with_stripe") {
        router.replace('/employers/profile');
        return;
      }

      if (status === "employer_no_stripe") {
        router.replace('/employers/register');
        return;
      }

      // fallback
      router.replace('/');
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
