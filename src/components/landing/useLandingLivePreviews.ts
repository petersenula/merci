"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
export type LandingLivePreview = {
  id: string;

  is_active: boolean;
  order: number | null;

  context_label: string;
  context_image_url: string;

  payment_image_url: string | null;
  name: string;
  goal_title: string | null;
  currency: string;

  goal_amount_cents: number;
  goal_start_amount_cents: number | null;
  goal_raised_amount_cents: number | null;
  payment_amount_cents: number | null;
};

export function useLandingLivePreviews() {
  const [data, setData] = useState<LandingLivePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("landing_live_previews")
        .select("*")
        .eq("is_active", true)
        .order("order", { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load landing_live_previews", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setData(data ?? []);
      setLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
  };
}
