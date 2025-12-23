'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckmarkAnimation } from '@/components/CheckmarkAnimation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { checkRegistrationStatus } from '@/lib/checkRegistrationStatus';

export default function EmployerOnboardingCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClientComponentClient();

  const lang = params.get("lang") || "de";

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
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

      // 2️⃣ принудительно синкаем Stripe → Supabase
      try {
        await fetch("/api/employers/stripe-settings", {
          method: "GET",
          credentials: "include",
        });
      } catch (e) {
        console.error("Stripe sync failed on onboarding complete", e);
      }

      // 3️⃣ теперь проверяем статус регистрации
      const { status } = await checkRegistrationStatus();

      if (status === "employer_with_stripe") {
        router.replace('/employers/profile');
        return;
      }

      if (status === "employer_no_stripe") {
        router.replace(`/employers/register?lang=${lang}`);
        return;
      }

      if (status === "earner_with_stripe") {
        router.replace('/earners/profile');
        return;
      }

      if (status === "earner_no_stripe") {
        router.replace(`/earners/register?lang=${lang}`);
        return;
      }

      router.replace('/');
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, supabase, lang]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
      <CheckmarkAnimation />
      <p className="text-xl font-semibold text-green-600">
        Registration completed
      </p>
    </div>
  );
}
