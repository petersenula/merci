'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/translation";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import Button from '@/components/ui/button';
import { checkRegistrationStatus } from "@/lib/checkRegistrationStatus";
import { useSearchParams } from 'next/navigation';
import { usePWAInstall } from "@/lib/usePWAInstall";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

function isMobileOrTablet(): boolean {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(max-width: 1024px)").matches;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-ignore iOS Safari
    window.navigator.standalone === true
  );
}

export default function UniversalSignin({ onCancel }: { onCancel?: () => void }) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  const chooseRegistrationRole =
    searchParams.get('registration') === 'choose';
  const { t, lang } = useT();
  const [wrongPassword, setWrongPassword] = useState(false);
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedEmail = email.trim().toLowerCase();
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const { canInstall, isInstalled, openOrInstall } = usePWAInstall();
  const [emailSent, setEmailSent] = useState(false);
  const [canResendEmail, setCanResendEmail] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  // состояния UX
  const [registrationStatus, setRegistrationStatus] = useState<
    "earner" | "employer" | "choose" | null
  >(null);

  const [noUser, setNoUser] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);

  const resetStates = () => {
    setRegistrationStatus(null);
    setNoUser(false);
    setWrongPassword(false);
    setEmailNotConfirmed(false);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    if (chooseRegistrationRole) {
      setRegistrationStatus("choose");
    }
  }, [chooseRegistrationRole]);

  useEffect(() => {
    if (!emailSent) return;

    setCanResendEmail(false);

    const timer = setTimeout(() => {
      setCanResendEmail(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [emailSent]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setRegistrationStatus(null);
    setNoUser(false);
    setWrongPassword(false);

    // 1️⃣ Пытаемся войти
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    // ❌ пользователь не найден или пароль неверный
    if (signInError) {
      const msg = signInError.message.toLowerCase();

      if (
        msg.includes("invalid login") ||
        msg.includes("invalid credentials")
      ) {
        // 🔐 пользователь есть, пароль неверный
        setWrongPassword(true);
        setLoading(false);
        return;
      }

      if (
        msg.includes("user not found") ||
        msg.includes("no user")
      ) {
        // 👤 пользователя действительно нет
        setNoUser(true);
        setLoading(false);
        return;
      }

      if (msg.includes("confirm")) {
        // ✉️ email не подтверждён
        setEmailNotConfirmed(true);
        setLoading(false);
        return;
      }

      // fallback
      setError(t("signin_error_unknown"));
      setLoading(false);
      return;
    }

    const user = data?.user;

    if (!user) {
      setRegistrationStatus("choose");
      setLoading(false);
      return;
    }

    // 🚨 EMAIL НЕ ПОДТВЕРЖДЁН
    if (!user.email_confirmed_at) {
      setEmailNotConfirmed(true);
      setLoading(false);
      return;
    }

    // 2️⃣ Проверяем статус регистрации
    const { status } = await checkRegistrationStatus(user.id);

    // ✔️ полностью зарегистрирован
    if (status === "earner_with_stripe") {
      router.push("/earners/profile");
      return;
    }

    if (status === "employer_with_stripe") {
      router.push("/employers/profile");
      return;
    }

    // 🔄 регистрация начата, но не завершена
    if (status === "earner_no_stripe") {
      setRegistrationStatus("earner");
      setLoading(false);
      return;
    }

    if (status === "employer_no_stripe") {
      setRegistrationStatus("employer");
      setLoading(false);
      return;
    }

    // 🤔 auth есть, но ни в одной таблице
    if (status === "auth_only") {
      setRegistrationStatus("choose");
      setLoading(false);
      return;
    }

    setError(t("signin_error_unknown"));
    setLoading(false);
  };

  if (emailSent) {
    return (
      <div className="space-y-5 text-center">
        <h2 className="text-xl font-semibold">
          {t("email_check_title")}
        </h2>

        <p className="text-sm text-slate-600">
          {t("email_check_text")}
        </p>

        <Button
          variant="green"
          onClick={() => {
            setEmailSent(false);
            setError(null);
          }}
          className="w-full"
        >
          {t("email_confirm_continue")}
        </Button>

        <p className="text-xs text-slate-500">
          {t("signin_confirmation_spam_hint")}
        </p>

        {canResendEmail && (
          <button
            onClick={async () => {
              setError(null);

              const { error } = await supabase.auth.resend({
                type: "signup",
                email: normalizedEmail,
                options: {
                  emailRedirectTo:
                    `${window.location.origin}/auth/callback` +
                    `?next=/auth/confirm` +
                    `&lang=${lang}`,
                },
              });

              if (error) {
                setError(t("signin_resend_failed"));
                return;
              }

              setCanResendEmail(false);
            }}
            className="text-xs text-blue-700 underline"
          >
            {t("signin_resend_confirmation")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-center">
        {t("signin_title")}
      </h1>

      <p className="text-sm text-slate-600 text-center">
        {noUser
          ? t("signin_subtitle_user_not_found")
          : wrongPassword
          ? t("signin_subtitle_wrong_password")
          : registrationStatus
          ? t("signin_subtitle_incomplete")
          : t("signin_subtitle_login")}
      </p>
      {wrongPassword && !noUser && (
        <div className="space-y-4">
          <p className="text-sm text-slate-700 text-center">
            {t("signin_wrong_password")}
          </p>

          <Button
            variant="green"
            onClick={() => {
              setWrongPassword(false);
              setPassword('');
            }}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium"
          >
            {t('signin_try_again')}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setEmail('');
              setPassword('');
              resetStates();
            }}
            className="w-full px-3 py-2 rounded-lg text-sm"
          >
            {t('signin_use_different_email')}
          </Button>

          <button
            className="text-xs text-blue-700 underline block mx-auto"
            onClick={() => setShowForgotModal(true)}
          >
            {t("signin_forgot_password")}
          </button>
        </div>
      )}  

      {/* 🆕 ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН */}
      {noUser && (
        <div className="space-y-4">
          <p className="text-sm text-slate-700 text-center">
            {t("signin_user_not_found")}
          </p>

          <Button
            variant="green"
            onClick={() =>
              router.push(
                `/signup?role=earner&email=${encodeURIComponent(normalizedEmail)}`
              )
            }
            className="w-full px-3 py-2 rounded-lg text-sm font-medium"
          >
            {t("signin_continue_as_worker")}
          </Button>

          <Button
            variant="green"
            onClick={() =>
              router.push(
                `/signup?role=employer&email=${encodeURIComponent(normalizedEmail)}`
              )
            }
            className="w-full px-3 py-2 rounded-lg text-sm font-medium"
          >
            {t("signin_continue_as_employer")}
          </Button>

          <button
            className="w-full px-3 py-2 rounded-lg border text-sm text-slate-700"
            onClick={() => {
              setEmail("");
              setPassword("");
              resetStates();
            }}
          >
            {t("signin_use_different_email")}
          </button>

          <button
            className="w-full px-3 py-2 rounded-lg border text-sm text-slate-700"
            onClick={onCancel ? onCancel : () => router.push("/")}
          >
            {t("signin_cancel")}
          </button>
        </div>
      )}

      {/* 🔄 НЕЗАВЕРШЁННАЯ РЕГИСТРАЦИЯ */}
      {registrationStatus && !noUser && (
        <div className="space-y-4">
          {(registrationStatus === "earner" || registrationStatus === "choose") && (
          <Button
            variant="green"
            onClick={() => router.push(`/earners/register?lang=${lang}`)}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium"
          >
            {t('signin_continue_as_worker')}
          </Button>
          )}

          {(registrationStatus === "employer" || registrationStatus === "choose") && (
            <button
              className="w-full px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium"
              onClick={() => router.push(`/employers/register?lang=${lang}`)}
            >
              {t("signin_continue_as_employer")}
            </button>
          )}

          <button
            className="w-full px-3 py-2 rounded-lg border text-sm text-slate-700"
            onClick={onCancel ? onCancel : () => router.push("/")}
          >
            {t("signin_cancel")}
          </button>
        </div>
      )}

      {emailNotConfirmed && (
        <div className="space-y-4">
          <p className="text-sm text-slate-700 text-center">
            {t("signin_email_not_confirmed")}
          </p>

          <Button
            variant="green"
            disabled={resendLoading}
            onClick={async () => {
              setResendLoading(true);
              setError(null);

              const { error } = await supabase.auth.resend({
                type: "signup",
                email: normalizedEmail,
                options: {
                  emailRedirectTo:
                    `${window.location.origin}/auth/callback` +
                    `?next=/auth/confirm` +
                    `&lang=${lang}`,
                },
              });

              if (error) {
                setError(t("signin_resend_failed"));
                setResendLoading(false);
                return;
              }
            }}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium"
          >
            {resendLoading
              ? t("signin_resending")
              : t("signin_resend_confirmation")}
          </Button>

          <button
            className="w-full px-3 py-2 rounded-lg border text-sm text-slate-700"
            onClick={() => {
              setPassword("");
              setEmailNotConfirmed(false);
            }}
          >
            {t("signin_try_again")}
          </button>
        </div>
      )}

      {/* 🔐 ФОРМА ЛОГИНА */}
      {!registrationStatus && !noUser && !wrongPassword && !emailNotConfirmed && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-5"
        >
          <GoogleAuthButton />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">
              {t("auth_or")}
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("signin_email")}
            </label>
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => {
                setHasUserInteracted(true);
                setEmail(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("signin_password")}
            </label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setHasUserInteracted(true);
                  setPassword(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium"
          >
            {loading ? t("signin_loading") : t("signin_submit")}
          </button>

          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-xs text-blue-700 underline hover:text-blue-900 block"
          >
            {t("signin_forgot_password")}
          </button>

          <button
            type="button"
            onClick={onCancel ? onCancel : () => router.push("/")}
            className="w-full px-3 py-2 rounded-lg border text-sm text-slate-700"
          >
            {t("signin_cancel")}
          </button>

          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="text-xs text-slate-500 underline text-center block mx-auto"
          >
            {t("signin_need_help")}
          </button>
          {showHelp && (
            <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 text-center space-y-2">
              <p>
                {t("signin_help_in_app_browser")}
              </p>
            </div>
          )}
        </form>
      )}
      <ForgotPasswordModal
        open={showForgotModal}
        initialEmail={email}
        onClose={() => setShowForgotModal(false)}
        onSubmit={async (emailToReset) => {
          const { error } = await supabase.auth.resetPasswordForEmail(
            emailToReset,
            {
              redirectTo: `${window.location.origin}/reset-password`,
            }
          );

          if (error) {
            setError(error.message);
            return;
          }
          setShowForgotModal(false);
          setLoading(false);
          setEmailSent(true);
        }}
      />
      {isMobileOrTablet() && canInstall && !isInstalled && (
        <div className="pt-6 border-t mt-6 text-center space-y-2">
          <p className="text-xs text-slate-500">
            {t("signin_install_app_hint_soft")}
          </p>

          <button
            onClick={() => openOrInstall(window.location.origin)}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium"
          >
            {t("onboarding_complete_download_app_button")}
          </button>
        </div>
      )}
    </div>
  );
}
