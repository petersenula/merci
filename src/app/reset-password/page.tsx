'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useT } from "@/lib/translation";
import { PasswordField } from "@/components/PasswordField";
import { PasswordConfirmField } from "@/components/PasswordConfirmField";

export default function ResetPasswordPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { t } = useT();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError(t("reset_password_invalid"));
      return;
    }

    if (password !== passwordConfirm) {
    setError(t("reset_password_mismatch"));
    return;
    }

    setLoading(true);

    // 🔥 This works ONLY if user came from reset-password email link
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);

    // Redirect to sign-in after a moment
    setTimeout(() => {
      router.push("/signin");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">

        <h1 className="text-xl font-semibold mb-3">
          {t("reset_password_title")}
        </h1>

        <p className="text-sm text-slate-600 mb-6">
          {t("reset_password_subtitle")}
        </p>

        {success ? (
          <div className="text-green-700 bg-green-50 border border-green-200 p-3 rounded">
            {t("reset_password_success")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
          <PasswordField
            label={t("reset_password_new")}
            value={password}
            onChange={setPassword}
            showRules={true}
          />

          <PasswordConfirmField
            label={t("reset_password_confirm")}
            value={passwordConfirm}
            compareTo={password}
            onChange={setPasswordConfirm}
          />

            {error && (
              <div className="text-red-700 bg-red-50 border border-red-200 p-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
            >
              {loading ? t("reset_password_loading") : t("reset_password_submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
