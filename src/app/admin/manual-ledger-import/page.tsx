"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import LedgerImportClient from "./LedgerImportClient";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      // 1️⃣ ждём текущую сессию
      const {
        data: { session },
      } = await supabaseAdminClient.auth.getSession();

      if (!session?.user) {
        router.replace("/admin/signin");
        return;
      }

      // 2️⃣ проверяем, админ ли
      const { data: admin } = await supabaseAdminClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!admin) {
        await supabaseAdminClient.auth.signOut();
        router.replace("/admin/signin");
        return;
      }

      if (mounted) setLoading(false);
    };

    run();

    // 3️⃣ подписываемся на изменения auth (важно!)
    const {
      data: { subscription },
    } = supabaseAdminClient.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/admin/signin");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return <div className="p-6">Checking admin access…</div>;
  }

  return <LedgerImportClient />;
}
