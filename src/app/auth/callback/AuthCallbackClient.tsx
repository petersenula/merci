'use client';

import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackClient() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.getSession();

      if (!error) {
        router.replace('/earners/profile');
      }
    };

    handleAuth();
  }, [router]);

  return <p className="text-center mt-10">Авторизация…</p>;
}
