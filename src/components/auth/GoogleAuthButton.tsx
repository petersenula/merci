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
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold"
        >
          G
        </span>

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
