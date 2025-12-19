// src/lib/supabaseBrowser.ts
"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ⬇️ ВАЖНО: клиент теперь типизирован
let _client: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient() {
  if (!_client) {
    _client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "click4tip-auth",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
}
