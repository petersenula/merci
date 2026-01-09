'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/translation';
import { PasswordField } from '@/components/PasswordField';
import { PasswordConfirmField } from '@/components/PasswordConfirmField';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import Button from '@/components/ui/button';
import Link from "next/link";

type SignupState =
  | "idle"
  | "success"
  | "exists_confirmed"
  | "exists_unconfirmed"
  | "used_by_employer";

export default function EarnerSignupForm() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { t, lang } = useT();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [successCanContinue, setSuccessCanContinue] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupState, setSignupState] = useState<SignupState>("idle");

  const [resendCooldown, setResendCooldown] = useState<number | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setPassword2('');
    setError(null);
    setSignupState("idle");
    setResendCooldown(null);
    setLoading(false);
  };

  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);

  /**
   * ⏱️ cooldown таймер
   */
  useEffect(() => {
    if (resendCooldown === null) return;
    if (resendCooldown <= 0) {
      setResendCooldown(null);
      return;
    }

    const timer = setTimeout(() => {
      setResendCooldown((v) => (v !== null ? v - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  /**
   * 🔁 resend confirmation
   */
  const RESEND_COOLDOWN_SECONDS = 12;

  const handleResend = async () => {
    // если уже идёт ожидание — ничего не делаем
    if (resendCooldown !== null) return;

    // ✅ СРАЗУ включаем отсчёт — даже если Supabase вернёт ошибку
    setResendCooldown(RESEND_COOLDOWN_SECONDS);

    setLoading(true);
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo:
            `${window.location.origin}/auth/callback` +
            `?next=/auth/confirm` +
            `&role=earner` +
            `&lang=${lang}`,
        },
      });

      if (resendError) {
        console.error("resendError:", resendError);
        setError(t("signin_resend_failed"));
        return;
      }

    } finally {
      setLoading(false);
    }
  };

  /**
   * 🟢 submit signup
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1️⃣ базовые проверки формы
    if (!email) {
      setError(t("signup_error_email_required"));
      return;
    }

    if (!passwordValid) {
      setError(t("signup_error_password_rules"));
      return;
    }

    if (password !== password2) {
      setError(t("signup_error_password_mismatch"));
      return;
    }

    if (signupState !== "idle") return;

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      /**
       * 2️⃣ preflight — проверка роли
       */
      const preflightRes = await fetch("/api/auth/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!preflightRes.ok) {
        setError(t("signup_error_unknown"));
        return;
      }

      const preflight = await preflightRes.json();

      // ❗ email уже используется РАБОТОДАТЕЛЕМ
      if (preflight.scenario === "employer_existing") {
        setSignupState("used_by_employer");
        return;
      }

      // ❗ email уже используется РАБОТНИКОМ
      if (preflight.scenario === "earner_existing") {
        setSignupState("exists_confirmed");
        return;
      }

      /**
       * 3️⃣ ПЫТАЕМСЯ SIGN IN — ТОЛЬКО КАК ПРОВЕРКУ
       */
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!signInError) {
        // ✅ пользователь существует и подтверждён
        // ❗️НО мы НЕ логиним и НЕ продолжаем
        setSignupState("exists_confirmed");
        return;
      }

      const signInMsg = signInError.message.toLowerCase();

      if (signInMsg.includes("confirm")) {
        // ❌ пользователь существует, но email не подтверждён
        setSignupState("exists_unconfirmed");
        return;
      }

      /**
       * 4️⃣ пользователь НЕ существует → делаем signUp
       */
      const { error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo:
            `${window.location.origin}/auth/callback` +
            `?next=/auth/confirm` +
            `&role=earner` +
            `&lang=${lang}`,
        },
      });

      if (signUpError) {
        setError(t("signup_error_unknown"));
        return;
      }

      // 🎉 новый пользователь
      setSignupState("success");

      // ⏱ через 30 секунд показываем кнопки
      setTimeout(() => {
        setSuccessCanContinue(true);
      }, 30000);

    } catch (err) {
      console.error("earner signup error:", err);
      setError(t("signup_error_unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-6 space-y-6">

        <h1 className="text-xl font-semibold">
          {t("signup_title")}
        </h1>

        <p className="text-sm text-slate-600">
          {t("signup_subtitle")}
        </p>

        {signupState !== "success" && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* EMAIL */}
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
              showRules
            />

            <PasswordConfirmField
              label={t("signup_passwordConfirm")}
              value={password2}
              compareTo={password}
              onChange={setPassword2}
            />

            {/* 🔴 EMAIL USED BY EMPLOYER */}
            {signupState === "used_by_employer" && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
                <p className="text-sm text-red-800 font-medium">
                  {t("signup_email_used_by_employer")}
                </p>

                <Button
                  type="button"
                  variant="green"
                  onClick={() =>
                    router.push(`/signin?role=employer&lang=${lang}`)
                  }
                  className="w-full"
                >
                  {t("signup_signin_as_employer")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full"
                >
                  {t("signup_use_different_email")}
                </Button>
              </div>
            )}

            {/* 🟡 EMAIL EXISTS, NOT CONFIRMED */}
            {signupState === "exists_unconfirmed" && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-300 p-4 space-y-3">
                <p className="text-sm text-yellow-800 text-center">
                  {t("email_check_text")}
                </p>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={resendCooldown !== null || loading}
                  className="w-full"
                >
                  {resendCooldown !== null
                    ? t("signup_please_wait")
                    : t("signin_resend_confirmation")}
                </Button>

                {resendCooldown !== null && (
                  <p className="text-xs text-slate-600 text-center">
                    {t("signup_resend_available_in")} {resendCooldown} {t("seconds")}
                  </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full"
                >
                  {t("signup_use_different_email")}
                </Button>
              </div>
            )}

            {/* 🔴 EMAIL EXISTS, CONFIRMED */}
            {signupState === "exists_confirmed" && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
                <p className="text-sm text-red-800 text-center">
                  {t("signup_email_exists_generic")}
                </p>

                <Button
                  type="button"
                  variant="green"
                  onClick={() =>
                    router.push(`/signin?email=${encodeURIComponent(email)}&lang=${lang}`)
                  }
                  className="w-full"
                >
                  {t("login")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full"
                >
                  {t("signup_use_different_email")}
                </Button>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="green"
              disabled={loading || signupState !== "idle"}
              className="w-full"
            >
              {loading ? t("signup_submitting") : t("signup_submit")}
            </Button>

            <p className="text-xs text-slate-500 text-center mt-4">
              {t("signup_terms_prefix")}{" "}
              <Link href="/terms" className="underline" target="_blank">
                {t("terms_title")}
              </Link>{" "}
              {t("signup_terms_and")}{" "}
              <Link href="/privacy" className="underline" target="_blank">
                {t("privacy_title")}
              </Link>
              .
            </p>
          </form>
        )}
        {signupState === "success" && (
          <div className="rounded-2xl bg-white shadow-lg p-6 space-y-4 text-center">

            <h2 className="text-xl font-semibold">
              {t("email_check_title")}
            </h2>

            <p className="text-sm text-slate-600">
              {t("email_check_text")}
            </p>

            <p className="text-xs text-slate-500">
              {t("email_check_hint_device")}
            </p>

            {!successCanContinue && (
              <p className="text-xs text-slate-400 pt-4">
                {t("signup_wait_30_seconds")}
              </p>
            )}

            {successCanContinue && (
              <div className="space-y-3 pt-4">

                <Button
                  variant="outline"
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full"
                >
                  {t("signin_resend_confirmation")}
                </Button>

                <Button
                  variant="green"
                  disabled={checkingSession}
                  onClick={async () => {
                    setCheckingSession(true);

                    const { data } = await supabase.auth.getSession();

                    if (data.session) {
                      // дальше твой существующий flow
                      router.replace(`/auth/confirm?role=earner&lang=${lang}`);
                    } else {
                      router.replace(`/signin?email=${encodeURIComponent(email)}&lang=${lang}`);
                    }
                  }}
                  className="w-full"
                >
                  {t("signup_confirmed_continue")}
                </Button>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
