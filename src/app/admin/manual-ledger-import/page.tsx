"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/admin/signin");
        return;
      }

      // 2️⃣ проверяем, админ ли
      const { data: admin } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!admin) {
        await supabase.auth.signOut();
        router.replace("/admin/signin");
        return;
      }

      if (mounted) setLoading(false);
    };

    run();

    // 3️⃣ подписываемся на изменения auth (важно!)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
