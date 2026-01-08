'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { Eye, EyeOff } from "lucide-react";
import { useT } from "@/lib/translation";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import Button from '@/components/ui/button';
import { checkRegistrationStatus } from "@/lib/checkRegistrationStatus";
import { useSearchParams } from 'next/navigation';
import { openInBrowser } from "@/lib/openInBrowser";

function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || '';
  const vendor = navigator.vendor || '';

  // 1. Явные in-app браузеры
  const inAppKeywords = [
    'FBAN',
    'FBAV',
    'Instagram',
    'Line',
    'LinkedIn',
    'Twitter',
    'Telegram',
    'WhatsApp',
    'Gmail',
    'Outlook',
  ];

  const isKnownInApp = inAppKeywords.some(k => ua.includes(k));

  // 2. iOS WebView (САМЫЙ НАДЁЖНЫЙ кейс)
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isIOSWebView =
    isIOS &&
    ua.includes('AppleWebKit') &&
    !ua.includes('Safari');

  // 3. Android WebView (wv)
  const isAndroidWebView =
    /Android/.test(ua) && ua.includes('wv');

  // 4. Android Chrome Custom Tab (Gmail, Outlook и др.)
  const isAndroidChromeLike =
    /Android/.test(ua) &&
    ua.includes('Chrome') &&
    vendor === 'Google Inc.' &&
    !ua.includes('Edg'); // Edge

  // 5. Дополнительный слабый сигнал
  const hasNoReferrer = document.referrer === '';

  return (
    isKnownInApp ||
    isIOSWebView ||
    isAndroidWebView ||
    (isAndroidChromeLike && hasNoReferrer)
  );
}

export default function UniversalSignin({ onCancel }: { onCancel?: () => void }) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

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

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-center">
        {t("signin_title")}
      </h1>

      {isInAppBrowser() && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 space-y-3">
          <p className="font-medium">
            {t("signin_open_in_browser_title")}
          </p>

          <p className="text-xs">
            {t("signin_open_in_browser_text")}
          </p>

          <button
            onClick={() => openInBrowser(window.location.href)}
            className="w-full px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium"
          >
            {t("signin_open_in_browser_button")}
          </button>
        </div>
      )}

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

              alert(t("signin_confirmation_resent"));
              setResendLoading(false);
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
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("signin_email")}
            </label>
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
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
          alert(
            `${t("signin_password_reset_sent")}\n\n${t("signin_confirmation_spam_hint")}`
          );
          setShowForgotModal(false);
        }}
      />
    </div>
  );
}
