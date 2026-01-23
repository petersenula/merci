'use client';

import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/lib/translation";

export default function AuthCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();

  const next = params.get("next") || "/";
  const lang = params.get("lang");
  const role = params.get("role");

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      const code = params.get("code");

      // 1️⃣ Если есть code → ОБЯЗАТЕЛЬНО exchange
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("exchangeCodeForSession error:", error);
        }
      }

      // 2️⃣ Ждём сессию, но ОГРАНИЧЕННО
      let session = null;

      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          session = data.session;
          break;
        }
        await new Promise(r => setTimeout(r, 300));
      }

      // 3️⃣ Дальше всегда редиректим (не зависаем)
      const url = new URL(next, window.location.origin);
      if (lang) url.searchParams.set("lang", lang);
      if (role) url.searchParams.set("role", role);

      router.replace(url.pathname + url.search);
    };

    run();
  }, [router, params, next, lang, role]);

  return (
    <p className="text-center mt-10">
      {t("auth_processing")}
    </p>
  );
}
