'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { checkRegistrationStatus } from '@/lib/checkRegistrationStatus';
import { useT } from '@/lib/translation';
import Button from '@/components/ui/button';

export default function AuthConfirmPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get('role');
  const { t } = useT();

  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);

  const lang = params.get('lang') || 'de';

  useEffect(() => {
    const run = async () => {
      // Supabase автоматически читает токены из URL
      let session = null;

      for (let i = 0; i < 10; i++) {
        const { data, error } = await supabase.auth.getSession();

        if (data?.session) {
          session = data.session;
          break;
        }

        await new Promise((r) => setTimeout(r, 300));
      }

      if (!session) {
        setError(true);
        return;
      }

      const userId = session.user.id;

      const { status } = await checkRegistrationStatus(userId);

      // 🔵 Новый пользователь или незавершённая регистрация работника
      if (status === 'auth_only') {
        // роль ОБЯЗАНА приходить из email-ссылки
        if (role === 'employer') {
          router.replace(`/employers/register?lang=${lang}`);
          return;
        }

        if (role === 'earner') {
          router.replace(`/earners/register?lang=${lang}`);
          return;
        }

        // OAuth sign-in can create a valid auth user without a role.
        // Reuse the existing role-choice UI instead of showing the
        // email/password sign-in form again.
        router.replace(`/signin?registration=choose&lang=${lang}`);
        return;
      }

      // 🟢 Fully registered worker
      if (status === 'earner_with_stripe') {
        router.replace(`/earners/profile?lang=${lang}`);
        return;
      }

      // 🔄 Worker registration exists but is not complete
      if (status === 'earner_no_stripe') {
        router.replace(`/earners/register?lang=${lang}`);
        return;
      }

      // 👔 Fully registered employer
      if (status === 'employer_with_stripe') {
        router.replace(`/employers/profile?lang=${lang}`);
        return;
      }

      // 🔄 Employer registration exists but is not complete
      if (status === 'employer_no_stripe') {
        router.replace(`/employers/register?lang=${lang}`);
        return;
      }

      // Fallback
      router.replace(`/signin?lang=${lang}`);
    };

    run();
  }, []);

  // ❌ Ошибка подтверждения
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-sm text-slate-600">
            {t('email_confirm_error')}
          </p>
          <Button
            variant="green"
            onClick={() => router.push(`/signin?lang=${lang}`)}
          >
            {t('email_confirm_continue')}
          </Button>
        </div>
      </div>
    );
  }

  // ⏳ Состояние ожидания
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-sm text-slate-600">
          {t('email_confirm_loading')}
        </p>
      </div>
    </div>
  );
}
