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
    const supabase = getSupabaseAdmin();

    console.log("DEBUG employerId:", employerId);
    console.log("DEBUG earnerId:", earnerId);

    // BASIC VALIDATION
    if (!amountCents || amountCents < 100) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!earnerId) {
      return NextResponse.json({ error: "Missing earnerId" }, { status: 400 });
    }

    // ============================================================
    // 1) ОПРЕДЕЛЯЕМ ПОЛУЧАТЕЛЯ (worker или employer)
    // ============================================================

    let stripeAccountId: string | null = null;
    let feePercent: number = 5; // default комиссия

    // 1A — пробуем загрузить работника
    const { data: worker } = await supabase
      .from("profiles_earner")
      .select("stripe_account_id, platform_fee_percent")
      .eq("id", earnerId)
      .maybeSingle()
      .returns<{
        stripe_account_id: string | null;
        platform_fee_percent: number | null;
      }>();

    if (worker) {
      // 🟢 ПОЛУЧАТЕЛЬ — РАБОТНИК
      stripeAccountId = worker.stripe_account_id;
      feePercent = Number(worker.platform_fee_percent ?? 5);
    } else {
      // 1B — пробуем загрузить работодателя
      const { data: employer } = await supabase
        .from("employers")
        .select("user_id, stripe_account_id, platform_fee_percent")
        .eq("user_id", earnerId)
        .maybeSingle()
        .returns<{
          user_id: string;
          stripe_account_id: string | null;
          platform_fee_percent: number | null;
        }>();

      if (!employer) {
        console.error("❌ No worker or employer found for given earnerId:", earnerId);
        return NextResponse.json({ error: "Recipient not found" }, { status: 500 });
      }

      // 🟢 ПОЛУЧАТЕЛЬ — РАБОТОДАТЕЛЬ
      stripeAccountId = employer.stripe_account_id;
      feePercent = Number(employer.platform_fee_percent ?? 5);
    }

    if (!stripeAccountId) {
      return NextResponse.json({ error: "Recipient has no Stripe account" }, { status: 400 });
    }

    // ============================================================
    // 2) ЕСЛИ НЕТ СХЕМЫ → ПРЯМОЙ ПЛАТЁЖ РАБОТНИКУ/РАБОТОДАТЕЛЮ
    // ============================================================
    if (!schemeId || !employerId) {
      console.log("💚 Direct tip → using WORKER/RECIPIENT fee:", feePercent);

      const platformFee = Math.round(amountCents * feePercent / 100);
      const stripeFee = Math.round(30 + amountCents * 0.029);
      const totalFeeToPlatform = platformFee + stripeFee;

      const intent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: currency.toLowerCase(),

        // Платформа получает свою комиссию + Stripe fee
        application_fee_amount: totalFeeToPlatform,

        transfer_data: {
          destination: stripeAccountId,
        },

        automatic_payment_methods: { enabled: true },

        metadata: {
          earner_id: earnerId,
          employer_id: "",
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
      currency: currency.toLowerCase(),
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
