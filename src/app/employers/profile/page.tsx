"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import { EmployerProfileLayout } from "./ProfileLayout";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type EmployerProfile = Database["public"]["Tables"]["employers"]["Row"];

export default function EmployerProfilePage() {
  const supabase = getSupabaseBrowserClient();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      // получаем сессию
      const { data: { session } } = await supabase.auth.getSession();

      console.log("🟢 EMPLOYER SESSION:", session);

      if (!session?.user) {
        setLoading(false);
        return;
      }

      // загружаем профиль работодателя
      const { data, error } = await supabase
        .from("employers")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) console.error("Error loading employer profile:", error);

      setProfile(data ?? null);
      setLoading(false);
    };

    loadProfile();
  }, []);

  if (loading) return <div>Loading…</div>;

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Employer profile not found…
      </div>
    );

  return <EmployerProfileLayout profile={profile} />;
}
