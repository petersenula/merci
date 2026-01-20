"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import LedgerImportClient from "./LedgerImportClient";

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabaseAdminClient.auth.getUser();

      // ❌ вообще не залогинен
      if (!data.user) {
        router.replace("/admin/signin");
        return;
      }

      const { data: admin } = await supabaseAdminClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      // ❌ залогинен, но не админ
      if (!admin) {
        await supabaseAdminClient.auth.signOut();
        router.replace("/admin/signin");
        return;
      }

      // ✅ всё ок
      setLoading(false);
    };

    checkAdmin();
  }, [router]);


  if (loading) {
    return <div className="p-6">Checking admin access…</div>;
  }

  return <LedgerImportClient />;
}
