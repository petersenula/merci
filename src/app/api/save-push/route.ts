import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();

  const session = await supabase.auth.getUser();
  const user = session.data.user;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { endpoint, keys } = body;

  await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint,
    auth: keys.auth,
    p256dh: keys.p256dh,
  });

  return NextResponse.json({ ok: true });
}
