import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type RegistrationRole = "earner" | "employer";

export async function startGoogleOAuth(args: {
  supabase: SupabaseClient<Database>;
  lang: string;
  role?: RegistrationRole;
}) {
  const { supabase, lang, role } = args;

  const callbackUrl = new URL(
    "/auth/callback",
    window.location.origin
  );

  callbackUrl.searchParams.set("next", "/auth/confirm");
  callbackUrl.searchParams.set("lang", lang);

  if (role) {
    callbackUrl.searchParams.set("role", role);
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    throw error;
  }
}
