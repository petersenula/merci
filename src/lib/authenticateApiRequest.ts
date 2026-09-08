import "server-only";

import { createClient, type User } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export async function authenticateApiRequest(
  req: Request
): Promise<User | null> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const supabaseAuth = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
