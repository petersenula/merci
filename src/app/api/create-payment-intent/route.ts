import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.error("STRIPE_SECRET_KEY missing");
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY missing" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecret);
  try {
    const body = await req.json();
    const { amountCents, currency, earnerId, rating, schemeId, employerId } = body;
    // Пока платформа работает только с CHF
    const effectiveCurrency = (currency ?? "").toLowerCase() === "chf" ? "chf" : "chf";

    const supabase = getSupabaseAdmin();

    console.log("DEBUG employerId:", employerId);
    console.log("DEBUG earnerId:", earnerId);

    // BASIC VALIDATION
    const MIN_CENTS = 100; // 1 CHF
    const MAX_CENTS = 1_000_000; // 10'000 CHF

    if (!amountCents || amountCents < MIN_CENTS || amountCents > MAX_CENTS) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Должен быть ЛИБО earnerId, ЛИБО employerId
    if (!earnerId && !employerId) {
      return NextResponse.json(
        { error: "Missing recipient (earnerId or employerId required)" },
        { status: 400 }
      );
    }

    // ============================================================
    // 1) ОПРЕДЕЛЯЕМ ПОЛУЧАТЕЛЯ (worker ИЛИ employer)
    // ============================================================

    let stripeAccountId: string | null = null;
    let feePercent: number = 5; // default комиссия

    // ---------- WORKER ----------
    if (earnerId) {
      const { data: worker } = await supabase
        .from("profiles_earner")
        .select("stripe_account_id, platform_fee_percent")
        .eq("id", earnerId)
        .maybeSingle<{
          stripe_account_id: string | null;
          platform_fee_percent: number | null;
        }>();

      if (!worker) {
        return NextResponse.json(
          { error: "Worker not found" },
          { status: 404 }
        );
      }

      stripeAccountId = worker.stripe_account_id;
      feePercent = Number(worker.platform_fee_percent ?? 5);
    }

    // ---------- EMPLOYER ----------
    if (!earnerId && employerId) {
      const { data: employer } = await supabase
        .from("employers")
        .select("stripe_account_id, platform_fee_percent")
        .eq("user_id", employerId)
        .maybeSingle<{
          stripe_account_id: string | null;
          platform_fee_percent: number | null;
        }>();

      if (!employer) {
        return NextResponse.json(
          { error: "Employer not found" },
          { status: 404 }
        );
      }

      stripeAccountId = employer.stripe_account_id;
      feePercent = Number(employer.platform_fee_percent ?? 5);
    }

    if (!stripeAccountId) {
      return NextResponse.json({ error: "Recipient has no Stripe account" }, { status: 400 });
    }

    // ============================================================
    // 2) ЕСЛИ НЕТ СХЕМЫ → ПРЯМОЙ ПЛАТЁЖ РАБОТНИКУ/РАБОТОДАТЕЛЮ
    // ============================================================
    if (!schemeId) {
      console.log("💚 Direct tip → using WORKER/RECIPIENT fee:", feePercent);

      const platformFee = Math.round(amountCents * feePercent / 100);
      const stripeFee = Math.round(30 + amountCents * 0.029);
      const totalFeeToPlatform = platformFee + stripeFee;

      const intent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: effectiveCurrency,

        // Платформа получает свою комиссию + Stripe fee
        application_fee_amount: totalFeeToPlatform,

        transfer_data: {
          destination: stripeAccountId,
        },

        automatic_payment_methods: { enabled: true },

        metadata: {
          earner_id: earnerId || "",
          employer_id: employerId || "",
          scheme_id: "",
          rating: rating ?? "",
          fee_percent: String(feePercent),
        },
      });

      return NextResponse.json({ clientSecret: intent.client_secret });
    }

    // ============================================================
    // 3) ПЛАТЁЖ ПО СХЕМЕ → ВСЕГДА ИСПОЛЬЗУЕМ КОМИССИЮ РАБОТОДАТЕЛЯ
    // ============================================================

    const { data: employerFeeSource } = await supabase
      .from("employers")
      .select("platform_fee_percent")
      .eq("user_id", employerId)
      .maybeSingle()
      .returns<{
        platform_fee_percent: number | null;
      }>();

    feePercent = Number(employerFeeSource?.platform_fee_percent ?? 5);

    console.log("🔵 Scheme payment → using EMPLOYER fee:", feePercent);

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: effectiveCurrency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        earner_id: earnerId,
        employer_id: employerId,
        scheme_id: schemeId,
        rating: rating ?? "",
        fee_percent: String(feePercent),
      },
    });

    return NextResponse.json({ clientSecret: intent.client_secret });

  } catch (err: any) {
    console.error("❌ Stripe Intent Error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
