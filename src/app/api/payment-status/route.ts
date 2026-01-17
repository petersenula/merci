import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  const url = new URL(req.url);
  const paymentIntentId = url.searchParams.get("payment_intent_id");

  if (!paymentIntentId) {
    return NextResponse.json(
      { ok: false, error: "payment_intent_id is required" },
      { status: 400 }
    );
  }

  // Ищем запись, которую создаёт webhook
  const { data: tip, error } = await supabaseAdmin
    .from("tips")
    .select(
      "status, amount_gross_cents, currency, payment_amount_cents, payment_currency"
    )
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  // Если webhook ещё не записал tip — значит всё ещё "processing"
  if (!tip) {
    return NextResponse.json({
      ok: true,
      state: "processing",
    });
  }

  // Определяем сумму/валюту для success-экрана
  const amountCents =
    tip.payment_amount_cents ?? tip.amount_gross_cents ?? null;
  const currency = (tip.payment_currency ?? tip.currency ?? "CHF").toUpperCase();

  // ВАЖНО:
  // - tip.status у тебя выставляется webhook'ом в "succeeded"
  // - если когда-то появится "failed" — мы тоже поддержим
  if (tip.status === "succeeded") {
    return NextResponse.json({
      ok: true,
      state: "succeeded",
      amountCents,
      currency,
    });
  }

  if (tip.status === "failed") {
    return NextResponse.json({
      ok: true,
      state: "failed",
    });
  }

  // Любой другой статус — считаем "processing"
  return NextResponse.json({
    ok: true,
    state: "processing",
  });
}
