'use client';

import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/lib/translation";

export default function AuthCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();

  const next = params.get("next") || "/signin";
  const lang = params.get("lang");
  const role = params.get("role");
  const { t } = useT();

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();

      // 🔑 ВАЖНО: даём Supabase один тик, чтобы он
      // обработал токены из URL и сохранил сессию
      await new Promise((r) => setTimeout(r, 0));

      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/signin");
        return;
      }

      const url = new URL(next, window.location.origin);

      if (lang) url.searchParams.set("lang", lang);
      if (role) url.searchParams.set("role", role);

      router.replace(url.pathname + url.search);
    };

    run();
  }, [router, next, lang, role]);

  return (
    <p className="text-center mt-10">
        {t("auth_processing")}
    </p>
  );
}
