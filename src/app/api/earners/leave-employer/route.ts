import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { employer_id, earner_id } = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    // Проверка входящих данных
    if (!employer_id || !earner_id) {
      return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
    }

    // Проверяем, что связь существует
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("employers_earners")
      .select("*")
      .eq("employer_id", employer_id)
      .eq("earner_id", earner_id)
      .maybeSingle();

    if (existingError) {
      console.error("EXISTING CHECK ERROR:", existingError);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    }

    // Деактивируем связь (но НЕ удаляем)
    const { error: updateError } = await supabaseAdmin
      .from("employers_earners")
      .update({
        is_active: false,
        pending: false,
        until_date: new Date().toISOString(), // <-- дата ухода
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("LEAVE UPDATE ERROR:", updateError);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (e) {
    console.error("LEAVE EMPLOYER SERVER ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
