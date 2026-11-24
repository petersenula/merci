// src/app/earners/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import { ProfileLayout } from "./ProfileLayout";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type EarnerProfile = Database["public"]["Tables"]["profiles_earner"]["Row"];

export default function ProfilePage() {
  // ❗ Используем ТОЛЬКО ОДИН корректный клиент
  const supabase = getSupabaseBrowserClient();

  const [profile, setProfile] = useState<EarnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      // 1. Получаем сессию
      const {
        data: { session },
      } = await supabase.auth.getSession();


      if (!session?.user) {
        setLoading(false);
        return;
      }

      // 2. Грузим профиль
      const { data, error } = await supabase
        .from("profiles_earner")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) console.error("Error loading profile:", error);

      setProfile(data ?? null);
      setLoading(false);
    };

    loadProfile();
  }, []);

  if (loading) {
    return <div>Loading…</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading profile…
      </div>
    );
  }

  return <ProfileLayout profile={profile} />;
}
