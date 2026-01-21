"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import LedgerImportClient from "./LedgerImportClient";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const supabase = getSupabaseBrowserClient();

      // 1️⃣ Проверяем, есть ли пользователь
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/admin/signin");
        return;
      }

      // 2️⃣ Проверяем, админ ли он (через API)
      const res = await fetch("/api/admin/check-access");

      if (!res.ok) {
        router.replace("/");
        return;
      }

      const result = await res.json();

      if (!result.ok) {
        router.replace("/");
        return;
      }

      // 3️⃣ Всё ок — показываем страницу
      setLoading(false);
    };

    checkAdminAccess();
  }, [router]);

  if (loading) {
    return <div className="p-6">Checking admin access…</div>;
  }

  return <LedgerImportClient />;
}
