"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export type DistributionScheme = {
  id: string;
  role: "employer" | "employee";
  profession_label: string;

  title: string | null;
  title_en?: string | null;
  title_de?: string | null;
  title_fr?: string | null;
  title_it?: string | null;

  description?: string | null;
  description_en?: string | null;
  description_de?: string | null;
  description_fr?: string | null;
  description_it?: string | null;

  image_url?: string | null;
  image_url_en?: string | null;
  image_url_de?: string | null;
  image_url_fr?: string | null;
  image_url_it?: string | null;
};

export function useLandingDistributionSchemes(role: "employer" | "employee") {
  const supabase = getSupabaseBrowserClient();

  const [data, setData] = useState<DistributionScheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    supabase
      .from("landing_distribution_schemes")
      .select(`
        id,
        role,
        profession_label,

        title,
        title_en,
        title_de,
        title_fr,
        title_it,

        description,
        description_en,
        description_de,
        description_fr,
        description_it,

        image_url,
        image_url_en,
        image_url_de,
        image_url_fr,
        image_url_it,

        is_active,
        sort_order
      `)
      .eq("role", role)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

      .then(({ data }) => {
        setData((data ?? []) as DistributionScheme[]);
        setLoading(false);
      });
  }, [role]);

  return { data, loading };
}
