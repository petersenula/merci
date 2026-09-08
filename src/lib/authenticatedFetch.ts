"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const supabase = getSupabaseBrowserClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);

  return fetch(input, {
    ...init,
    headers,
  });
}
