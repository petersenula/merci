import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { earner_id } = await req.json();

  // 1. Все части схем, где участвует работник
  const { data: parts, error: partsErr } = await supabase
    .from("allocation_scheme_parts")
    .select("scheme_id, label, percent")
    .eq("destination_type", "earner")
    .eq("destination_id", earner_id);

  if (partsErr) {
    return NextResponse.json({ error: partsErr.message }, { status: 500 });
  }

  if (!parts?.length) {
    return NextResponse.json({ schemes: [] });
  }

  const schemeIds = parts.map((p) => p.scheme_id);

  // 2. Получаем схемы по id
  const { data: schemes, error: schemeErr } = await supabase
    .from("allocation_schemes")
    .select("id, name, employer_id")
    .in("id", schemeIds);

  if (schemeErr) {
    return NextResponse.json({ error: schemeErr.message }, { status: 500 });
  }

  // 3. Собираем результат
  const result = parts.map((part) => {
    const scheme = schemes.find((s) => s.id === part.scheme_id);
    return {
      scheme_id: part.scheme_id,
      scheme_name: scheme?.name ?? "Unknown scheme",
      employer_id: scheme?.employer_id ?? null,
      percent: part.percent,
      label: part.label,
    };
  });

  return NextResponse.json({ schemes: result });
}