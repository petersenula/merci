'use client';

import { useT } from '@/lib/translation';

export default function InvalidSchemeQrMessage() {
  const { t } = useT();

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-lg">
        <h1 className="text-lg font-semibold text-slate-900">
          {t('invalid_scheme_qr_title')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {t('invalid_scheme_qr_message')}
        </p>
      </div>
    </main>
  );
}
