import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export function useLandingQrScenes() {
  const supabase = getSupabaseBrowserClient();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("landing_qr_scenes")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setData(data ?? []);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}
