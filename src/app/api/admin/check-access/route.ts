import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // ✅ ВАЖНО: getSession, а не getUser
  const { data, error } = await supabase.auth.getSession();

  const user = data?.session?.user;

  if (error || !user) {
    return NextResponse.json(
      { ok: false, reason: "no-session" },
      { status: 401 }
    );
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json(
      { ok: false, reason: "not-admin" },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
