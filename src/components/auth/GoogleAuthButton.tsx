'use client';

import { useState } from 'react';
import { useT } from '@/lib/translation';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { startGoogleOAuth } from '@/lib/googleOAuth';

type Props = {
  role?: 'earner' | 'employer';
  beforeStart?: () => boolean | void;
};

export default function GoogleAuthButton({ role, beforeStart }: Props) {
  const { t, lang } = useT();
  const supabase = getSupabaseBrowserClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);

    if (beforeStart && beforeStart() === false) {
      return;
    }

    setLoading(true);

    try {
      await startGoogleOAuth({
        supabase,
        lang,
        role,
      });
    } catch (err) {
      console.error('Google OAuth failed:', err);
      setError(t('auth_google_error'));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5 shrink-0"
          viewBox="0 0 18 18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#4285F4"
            d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.798 2.715v2.258h2.909c1.702-1.567 2.685-3.874 2.685-6.614Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.468-.806 5.955-2.181l-2.909-2.258c-.806.54-1.835.859-3.046.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.963 10.706A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.168.281-1.706V4.962H.956A9 9 0 0 0 0 9c0 1.452.347 2.826.956 4.038l3.007-2.332Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.322 0 2.508.454 3.442 1.346l2.582-2.582C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.962l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"
          />
        </svg>

        {loading
          ? t('auth_google_loading')
          : t('auth_google_continue')}
      </button>

      {error && (
        <p className="text-xs text-red-700 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
