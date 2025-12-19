'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackClient() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClientComponentClient();
      const { error } = await supabase.auth.getSession();

      if (!error) {
        router.replace('/earners/profile');
      }
    };

    handleAuth();
  }, [router]);

  return <p className="text-center mt-10">Авторизация…</p>;
}
