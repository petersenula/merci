"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export type LandingTipPreview = {
  id: string;
  name: string;
  image_url?: string | null;
  goal_title?: string | null;

  goal_amount_cents: number | null;
  goal_earned_since_start_cents: number | null;

  currency: string;
};

export function useLandingTipPreview() {
  const [data, setData] = useState<LandingTipPreview[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function load() {
      const { data, error } = await supabase
      .from("landing_tip_previews")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });


      if (!error && data) {
        setData(data);
      }

      setLoading(false);
    }

    load();
  }, []);

  return { data, loading };
}
