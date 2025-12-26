'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/translation';
import { PasswordField } from '@/components/PasswordField';
import { PasswordConfirmField } from '@/components/PasswordConfirmField';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import Button from '@/components/ui/button';
import Link from "next/link";

import { checkRegistrationStatus } from "@/lib/checkRegistrationStatus";

export default function EmployerSignupForm() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { t, lang } = useT();

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCompanyName('');
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

    if (!companyName) return setError(t("signup_employer_error_company_required"));
    if (!email) return setError(t("signup_employer_error_email_required"));
    if (!passwordValid) return setError(t("signup_employer_error_password_rules"));
    if (password !== password2)
      return setError(t("signup_employer_error_password_mismatch"));

    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // 1️⃣ Пытаемся зарегистрировать
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
        // ❌ Неверный пароль
        if (signInError || !signInData?.user) {
          setError("EMAIL_EXISTS");
          setLoading(false);
          return;
        }

        // ✔️ Пароль верный → проверяем статус
        const { status } = await checkRegistrationStatus();

        if (status === "employer_with_stripe") {
          router.push("/employers/profile");
          return;
        }

        if (status === "earner_with_stripe" || status === "earner_no_stripe") {
          setError("EMAIL_USED_BY_WORKER");
          setLoading(false);
          return;
        }

        // auth_only или employer_no_stripe → продолжаем регистрацию
        localStorage.setItem("employer_company_name", companyName);
        localStorage.setItem("employer_email", normalizedEmail);

        router.push(`/employers/register?lang=${lang}`);
        return;
      }

      // 🆕 Новый пользователь → логиним
      const { data: signInDataNew, error: signInErrorNew } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInErrorNew || !signInDataNew?.user) {
        setError(t("signup_employer_error_unknown"));
        setLoading(false);
        return;
      }

      // Проверяем статус на всякий случай
      const { status } = await checkRegistrationStatus();

      if (status === "earner_with_stripe" || status === "earner_no_stripe") {
        setError("EMAIL_USED_BY_WORKER");
        setLoading(false);
        return;
      }

      if (status === "employer_with_stripe") {
        router.push("/employers/profile");
        return;
      }

      localStorage.setItem("employer_company_name", companyName);
      localStorage.setItem("employer_email", email);

      router.push(`/employers/register?lang=${lang}`);

    } catch (err) {
      console.error(err);
      setError(t("signup_employer_error_unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-6 space-y-6">

        <h1 className="text-xl font-semibold">{t("signup_employer_title")}</h1>
        <p className="text-sm text-slate-600">{t("signup_employer_subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("signup_employer_companyName")}
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("signup_employer_email")}
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
            label={t("signup_employer_password")}
            value={password}
            onChange={setPassword}
            showRules={true}
          />

          <PasswordConfirmField
            label={t("signup_employer_passwordConfirm")}
            value={password2}
            compareTo={password}
            onChange={setPassword2}
          />

          {error === "EMPLOYER_EXISTS" && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 space-y-3">
              <p className="text-yellow-800 text-sm font-medium">
                {t("signup_employer_exists")}
              </p>
              <Button
                type="button"
                variant="green"
                onClick={() =>
                  router.push(`/employers/signin?email=${encodeURIComponent(email)}`)
                }
                className="w-full px-3 py-2 rounded-lg text-sm"
              >
                {t('signup_employer_login_instead')}
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

          {error === "EMAIL_USED_BY_WORKER" && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 space-y-3">
              <p className="text-yellow-800 text-sm font-medium">
                {t("signup_employer_email_used_by_worker")}
              </p>
              <Button
                type="button"
                variant="green"
                onClick={() =>
                  router.push(`/earners/signin?email=${encodeURIComponent(email)}`)
                }
                className="w-full px-3 py-2 rounded-lg text-sm"
              >
                {t('signup_login_as_worker')}
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

          {error &&
            !["EMPLOYER_EXISTS", "EMAIL_USED_BY_WORKER", "EMAIL_EXISTS"].includes(error) && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

          {error === "EMAIL_EXISTS" && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 space-y-3">
              <p className="text-yellow-800 text-sm font-medium">
                {t("signup_email_exists_generic")}
              </p>
              <Button
                type="button"
                variant="green"
                onClick={() => router.push('/signin')}
                className="w-full px-3 py-2 rounded-lg text-sm"
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
          <Button
            type="submit"
            variant="green"
            disabled={loading}
            className="px-3 py-2 w-full rounded-lg font-medium text-sm"
          >
            {loading
              ? t('signup_employer_submitting')
              : t('signup_employer_submit')}
          </Button>
          <p className="text-xs text-slate-500 text-center mt-4">
            {t("signup_terms_prefix")}{" "}
            <Link
              href="/terms"
              className="underline hover:text-slate-700"
              target="_blank"
            >
              {t("terms_title")}
            </Link>{" "}
            {t("signup_terms_and")}{" "}
            <Link
              href="/privacy"
              className="underline hover:text-slate-700"
              target="_blank"
            >
              {t("privacy_title")}
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
