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

    // ============================================================
    // 1) ПРЯМОЙ ПЛАТЁЖ
    //    Recipient Stripe account is needed only when there is no scheme.
    // ============================================================

    let feePercent: number = 5;

    if (!schemeId) {
      if (!earnerId && !employerId) {
        return NextResponse.json(
          { error: "Missing recipient (earnerId or employerId required)" },
          { status: 400 }
        );
      }

      let stripeAccountId: string | null = null;

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
      } else if (employerId) {
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
        return NextResponse.json(
          { error: "Recipient has no Stripe account" },
          { status: 400 }
        );
      }

      console.log("💚 Direct tip → using RECIPIENT fee:", feePercent);

      const platformFee = Math.round(amountCents * feePercent / 100);
      const stripeFee = Math.round(30 + amountCents * 0.029);
      const totalFeeToPlatform = platformFee + stripeFee;

      const intent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: effectiveCurrency,

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
    // 3) ПЛАТЁЖ ПО СХЕМЕ
    //    Scheme + employer + parts are resolved server-side.
    //    The exact parts are snapshotted before clientSecret is returned.
    // ============================================================

    const { data: scheme, error: schemeError } = await supabase
      .from("allocation_schemes")
      .select("id, employer_id")
      .eq("id", schemeId)
      .maybeSingle();

    if (schemeError || !scheme) {
      console.error("Scheme load failed:", schemeError);
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    const resolvedEmployerId = scheme.employer_id;

    const { data: schemeParts, error: partsError } = await supabase
      .from("allocation_scheme_parts")
      .select(`
        scheme_id,
        part_index,
        label,
        percent,
        destination_kind,
        destination_type,
        destination_id
      `)
      .eq("scheme_id", schemeId)
      .order("part_index");

    if (partsError || !schemeParts || schemeParts.length === 0) {
      console.error("Scheme parts load failed:", partsError);
      return NextResponse.json(
        { error: "Scheme has no valid parts" },
        { status: 400 }
      );
    }

    const totalPercent = schemeParts.reduce(
      (sum, part) => sum + Number(part.percent || 0),
      0
    );

    if (Math.abs(totalPercent - 100) > 0.000001) {
      return NextResponse.json(
        { error: "Scheme allocation must total 100%" },
        { status: 400 }
      );
    }

    const hasInvalidPart = schemeParts.some(
      (part) =>
        !part.destination_id ||
        !part.destination_kind ||
        Number(part.percent) <= 0
    );

    if (hasInvalidPart) {
      return NextResponse.json(
        { error: "Scheme contains an invalid allocation part" },
        { status: 400 }
      );
    }

    const { data: employerFeeSource, error: employerFeeError } = await supabase
      .from("employers")
      .select("platform_fee_percent")
      .eq("user_id", resolvedEmployerId)
      .maybeSingle();

    if (employerFeeError || !employerFeeSource) {
      console.error("Scheme employer load failed:", employerFeeError);
      return NextResponse.json(
        { error: "Scheme employer not found" },
        { status: 404 }
      );
    }

    feePercent = Number(employerFeeSource.platform_fee_percent ?? 5);

    console.log("🔵 Scheme payment → using EMPLOYER fee:", feePercent);

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: effectiveCurrency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        earner_id: earnerId || "",
        employer_id: resolvedEmployerId,
        scheme_id: schemeId,
        rating: rating ?? "",
        fee_percent: String(feePercent),
      },
    });

    const { error: snapshotError } = await supabase
      .from("payment_scheme_snapshots")
      .insert({
        payment_intent_id: intent.id,
        scheme_id: schemeId,
        employer_id: resolvedEmployerId,
        parts: schemeParts,
      });

    if (snapshotError) {
      console.error("Scheme snapshot save failed:", snapshotError);

      try {
        await stripe.paymentIntents.cancel(intent.id);
      } catch (cancelError) {
        console.error(
          "Failed to cancel PaymentIntent after snapshot error:",
          cancelError
        );
      }

      return NextResponse.json(
        { error: "Failed to prepare scheme payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clientSecret: intent.client_secret });

  } catch (err: any) {
    console.error("❌ Stripe Intent Error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
