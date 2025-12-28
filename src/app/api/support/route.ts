import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Honeypot: бот часто заполнит это поле
    if (body.website && String(body.website).trim() !== "") {
      return NextResponse.json({ ok: true }); // тихо "успешно"
    }

    const category = String(body.category || "").trim();
    const role = body.role ? String(body.role).trim() : null;
    const name = body.name ? String(body.name).trim() : null;
    const email = String(body.email || "").trim().toLowerCase();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    const lang = body.lang ? String(body.lang).trim() : null;
    const page_url = body.page_url ? String(body.page_url).trim() : null;

    if (!["support", "feedback"].includes(category)) {
      return NextResponse.json({ error: "INVALID_CATEGORY" }, { status: 400 });
    }

    if (role && !["earner", "employer", "visitor"].includes(role)) {
      return NextResponse.json({ error: "INVALID_ROLE" }, { status: 400 });
    }

    if (!email || !isEmail(email)) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    if (!subject || subject.length < 3) {
      return NextResponse.json({ error: "INVALID_SUBJECT" }, { status: 400 });
    }

    if (!message || message.length < 10) {
      return NextResponse.json({ error: "INVALID_MESSAGE" }, { status: 400 });
    }

    // optional: get current user id (если пользователь залогинен и cookies доступны)
    const supabaseAdmin = getSupabaseAdmin();

    const user_agent = req.headers.get("user-agent");
    // user_id мы здесь не достаём из cookies (нужно больше контекста),
    // но можно передавать с клиента, если у тебя есть session.user.id.

    const { error } = await supabaseAdmin.from("support_requests").insert({
      category,
      role,
      name,
      email,
      subject,
      message,
      lang,
      page_url,
      user_agent,
      status: "new",
    });

    if (error) {
      console.error("support insert error:", error);
      return NextResponse.json({ error: "DB_INSERT_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("support route error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
