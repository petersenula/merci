'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/translation';
import { PasswordField } from '@/components/PasswordField';
import { PasswordConfirmField } from '@/components/PasswordConfirmField';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import Button from '@/components/ui/button';

import { checkRegistrationStatus } from "@/lib/checkRegistrationStatus";

export default function EarnerSignupForm() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { t, lang } = useT();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setPassword2('');
    setError(null);
    setLoading(false);
  };

  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) return setError(t("signup_error_email_required"));
    if (!password) return setError(t("signup_error_password_required"));
    if (!passwordValid) return setError(t("signup_error_password_rules"));
    if (password !== password2) return setError(t("signup_error_password_mismatch"));

    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // 1️⃣ Пробуем sign up
      const { error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      // 👤 Пользователь уже существует
      if (signUpError?.status === 422) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
        // ❌ Пароль неверный
        if (signInError || !signInData?.user) {
          setError("EMAIL_EXISTS");
          setLoading(false);
          return;
        }

        // ✔️ Пароль верный → смотрим статус
        const { status } = await checkRegistrationStatus();

        if (status === "earner_with_stripe") {
          router.push("/earners/profile");
          return;
        }

        if (status === "earner_no_stripe" || status === "auth_only") {
          router.push(`/earners/register?lang=${lang}`);
          return;
        }

        // email принадлежит работодателю
        setError("EMAIL_EXISTS");
        setLoading(false);
        return;
      }

      // 🆕 Новый пользователь → логиним
      const { data: signInDataNew, error: signInErrorNew } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInErrorNew || !signInDataNew?.user) {
        setError(t("signup_error_unknown"));
        setLoading(false);
        return;
      }

      router.push(`/earners/register?lang=${lang}`);

    } catch (err) {
      console.error(err);
      setError(t("signup_error_unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-6 space-y-6">

        <h1 className="text-xl font-semibold">{t("signup_title")}</h1>
        <p className="text-sm text-slate-600">{t("signup_subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("signup_email")}
            </label>
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <PasswordField
            label={t("signup_password")}
            value={password}
            onChange={setPassword}
            showRules={true}
          />

          <PasswordConfirmField
            label={t("signup_passwordConfirm")}
            value={password2}
            compareTo={password}
            onChange={setPassword2}
          />

          {error === "EMAIL_EXISTS" && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-300 p-4 space-y-3">
              <p className="text-sm text-yellow-800 font-medium">
                {t("signup_email_exists_generic")}
              </p>
              <Button
                type="button"
                variant="green"
                onClick={() => router.push('/signin')}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium"
              >
                {t('signup_continue_to_signin')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="w-full px-3 py-2 rounded-lg text-sm"
              >
                {t('signup_use_different_email')}
              </Button>
            </div>
          )}

          {error && error !== "EMAIL_EXISTS" && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
          <Button
            type="submit"
            variant="green"
            disabled={loading}
            className="px-3 py-2 w-full rounded-lg font-medium text-sm"
          >
            {loading ? t('signup_submitting') : t('signup_submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
