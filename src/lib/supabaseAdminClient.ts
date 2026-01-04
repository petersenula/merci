"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export const supabaseAdminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storageKey: "click4tip-admin-auth",
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
