'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckmarkAnimation } from '@/components/CheckmarkAnimation';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import LoaderOverlay from '@/components/ui/LoaderOverlay';

export default function EmployerOnboardingCompletePage() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = getSupabaseBrowserClient();

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
      router.replace(`/employers/profile?lang=${lang}`);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router, supabase, lang]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
      <LoaderOverlay show />
      <CheckmarkAnimation />
      <p className="text-xl font-semibold text-green-600">
        Registration completed
      </p>
    </div>
  );
}
