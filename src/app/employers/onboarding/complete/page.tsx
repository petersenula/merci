'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckmarkAnimation } from '@/components/CheckmarkAnimation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { checkRegistrationStatus } from '@/lib/checkRegistrationStatus';
import LoaderOverlay from '@/components/ui/LoaderOverlay';

export default function EmployerOnboardingCompletePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClientComponentClient();

  const lang = params.get("lang") || "de";

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
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

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          await supabase.auth.signOut();
          router.replace("/login?reason=no_session_after_stripe");
          return;
        }

        // 2️⃣ ждём, пока Stripe обновится в Supabase
        for (let i = 0; i < 10; i++) {
          if (cancelled) return;

          const { data } = await supabase
            .from("employers")
            .select("stripe_account_id, stripe_status")
            .eq("user_id", user.id)
            .single();

          if (data?.stripe_account_id && data?.stripe_status !== "pending") {
            break;
          }

          await new Promise((r) => setTimeout(r, 400));
        }

        if (cancelled) return;

        // 3️⃣ проверяем статус регистрации
        const { status } = await checkRegistrationStatus(user.id);

        if (status === "no_user" || status === "auth_only") {
          await supabase.auth.signOut();
          router.replace("/login?reason=invalid_registration_state");
          return;
        }

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
      } finally {
        // ⚠️ на случай, если редирект не случился
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, supabase, lang]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
      <LoaderOverlay show={loading} />
      <CheckmarkAnimation />
      <p className="text-xl font-semibold text-green-600">
        Registration completed
      </p>
    </div>
  );
}
