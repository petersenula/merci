'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useT } from '@/lib/translation';

export default function CheckEmailPage() {
  const params = useSearchParams();
  const { t } = useT();

  const lang = params.get('lang') || 'en';

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-6 space-y-6 text-center">

        <h1 className="text-xl font-semibold">
          {t('email_check_title')}
        </h1>

        <p className="text-sm text-slate-600">
          {t('email_check_text')}
        </p>

        <p className="text-xs text-slate-500">
          {t('email_check_hint_device')}
        </p>

        <div className="pt-4 text-xs text-slate-400">
          {t('signup_terms_prefix')}{' '}
          <Link
            href="/terms"
            className="underline hover:text-slate-600"
            target="_blank"
          >
            {t('terms_title')}
          </Link>{' '}
          {t('signup_terms_and')}{' '}
          <Link
            href="/privacy"
            className="underline hover:text-slate-600"
            target="_blank"
          >
            {t('privacy_title')}
          </Link>
        </div>

      </div>
    </div>
  );
}
