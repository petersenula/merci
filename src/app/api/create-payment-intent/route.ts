import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { calculatePaymentAmount } from "@/lib/paymentFeeGrossUp";
import { getActiveMarketConfig, getCountryConfig } from "@/lib/marketConfig";
import { requireStripeFeeProfile } from "@/lib/stripeFeeConfig";

export const runtime = "nodejs";

const activeMarket = getActiveMarketConfig();

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
    const {
      amountCents,
      slug,
      rating,
      reviewText,
      schemeId,
      coverFees = false,
    } = body;

    if (typeof coverFees !== "boolean") {
      return NextResponse.json(
        { error: "coverFees must be boolean" },
        { status: 400 }
      );
    }

    const normalizedReviewText =
      typeof reviewText === "string"
        ? reviewText.trim().slice(0, 500)
        : "";

    const ratingOmitted =
      rating === undefined || rating === null || rating === "";

    if (
      !ratingOmitted &&
      (
        typeof rating !== "number" ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      )
    ) {
      return NextResponse.json(
        { error: "Invalid rating" },
        { status: 400 }
      );
    }

    const normalizedRating = ratingOmitted ? null : rating;

    const supabase = getSupabaseAdmin();

    // BASIC VALIDATION
    const MIN_CENTS = 100; // 1 CHF
    const MAX_CENTS = 1_000_000; // 10'000 CHF

    if (
      typeof amountCents !== "number" ||
      !Number.isInteger(amountCents) ||
      amountCents < MIN_CENTS ||
      amountCents > MAX_CENTS
    ) {
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
      if (typeof slug !== "string" || !slug.trim()) {
        return NextResponse.json(
          { error: "Missing payment page slug" },
          { status: 400 }
        );
      }

      const normalizedSlug = slug.trim();
      let stripeAccountId: string | null = null;
      let resolvedEarnerId: string | null = null;
      let resolvedEmployerId: string | null = null;
      let accountCurrency: string | null = null;
      let accountCountryCode: string | null = null;

      const { data: worker, error: workerError } = await supabase
        .from("profiles_earner")
        .select("id, stripe_account_id, platform_fee_percent, currency, country_code")
        .eq("slug", normalizedSlug)
        .eq("is_active", true)
        .maybeSingle<{
          id: string;
          stripe_account_id: string | null;
          platform_fee_percent: number | null;
          currency: string;
          country_code: string | null;
        }>();

      if (workerError) {
        console.error("Direct payment worker lookup failed:", workerError);
        return NextResponse.json(
          { error: "Failed to resolve payment recipient" },
          { status: 500 }
        );
      }

      if (worker) {
        resolvedEarnerId = worker.id;
        stripeAccountId = worker.stripe_account_id;
        accountCurrency = String(worker.currency ?? "").toLowerCase();
        accountCountryCode = worker.country_code ?? null;
        feePercent = Number(worker.platform_fee_percent ?? 5);
      } else {
        const { data: employer, error: employerError } = await supabase
          .from("employers")
          .select("user_id, stripe_account_id, platform_fee_percent, currency, country_code")
          .eq("slug", normalizedSlug)
          .eq("is_active", true)
          .maybeSingle<{
            user_id: string;
            stripe_account_id: string | null;
            platform_fee_percent: number | null;
            currency: string;
            country_code: string;
          }>();

        if (employerError) {
          console.error(
            "Direct payment employer lookup failed:",
            employerError
          );
          return NextResponse.json(
            { error: "Failed to resolve payment recipient" },
            { status: 500 }
          );
        }

        if (!employer) {
          return NextResponse.json(
            { error: "Payment recipient not found" },
            { status: 404 }
          );
        }

        resolvedEmployerId = employer.user_id;
        stripeAccountId = employer.stripe_account_id;
        accountCurrency = String(employer.currency ?? "").toLowerCase();
        accountCountryCode = employer.country_code ?? null;
        feePercent = Number(employer.platform_fee_percent ?? 5);
      }

      if (!stripeAccountId) {
        return NextResponse.json(
          { error: "Recipient has no Stripe account" },
          { status: 400 }
        );
      }

      if (!accountCurrency || !accountCountryCode) {
        return NextResponse.json(
          { error: "Recipient country or currency is not configured" },
          { status: 400 }
        );
      }

      const recipientCountryConfig = getCountryConfig(
        activeMarket.market,
        accountCountryCode
      );

      if (!recipientCountryConfig) {
        return NextResponse.json(
          { error: "Recipient country is not supported in this market" },
          { status: 400 }
        );
      }

      if (
        accountCurrency.toUpperCase() !== recipientCountryConfig.currency
      ) {
        return NextResponse.json(
          { error: "Recipient currency does not match recipient country" },
          { status: 400 }
        );
      }

      const stripeFeeProfile = requireStripeFeeProfile(
        activeMarket.market,
        recipientCountryConfig.currency
      );

      console.log(
        "💚 Direct tip → using RECIPIENT fee/currency/pricing:",
        feePercent,
        accountCurrency,
        stripeFeeProfile.pricingKey
      );

      const paymentBreakdown = calculatePaymentAmount({
        tipAmountCents: amountCents,
        feePercent,
        coverFees,
        stripeFeeProfile,
      });

      const totalFeeToPlatform =
        paymentBreakdown.platformFeeCents +
        paymentBreakdown.stripeFeeCents;

      const intent = await stripe.paymentIntents.create({
        amount: paymentBreakdown.paymentAmountCents,
        currency: accountCurrency,

        application_fee_amount: totalFeeToPlatform,

        transfer_data: {
          destination: stripeAccountId,
        },

        automatic_payment_methods: { enabled: true },

        metadata: {
          earner_id: resolvedEarnerId ?? "",
          employer_id: resolvedEmployerId ?? "",
          scheme_id: "",
          rating: normalizedRating ?? "",
          review_text: normalizedReviewText,
          fee_percent: String(feePercent),
          stripe_fee_pricing_key: stripeFeeProfile.pricingKey,
          tip_amount_cents: String(paymentBreakdown.tipAmountCents),
          fee_coverage_cents: String(paymentBreakdown.feeCoverageCents),
          cover_fees: String(coverFees),
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
      .select("platform_fee_percent, is_active, country_code, currency")
      .eq("user_id", resolvedEmployerId)
      .maybeSingle();

    if (
      employerFeeError ||
      !employerFeeSource ||
      employerFeeSource.is_active !== true
    ) {
      console.error("Scheme employer unavailable:", employerFeeError);
      return NextResponse.json(
        { error: "Payment scheme unavailable" },
        { status: 404 }
      );
    }

    feePercent = Number(employerFeeSource.platform_fee_percent ?? 5);

    const schemeCountryCode = String(
      employerFeeSource.country_code ?? ""
    ).toUpperCase();

    const schemeCurrency = String(
      employerFeeSource.currency ?? ""
    ).toLowerCase();

    if (!schemeCountryCode || !schemeCurrency) {
      return NextResponse.json(
        { error: "Scheme employer country or currency is not configured" },
        { status: 400 }
      );
    }

    const schemeCountryConfig = getCountryConfig(
      activeMarket.market,
      schemeCountryCode
    );

    if (!schemeCountryConfig) {
      return NextResponse.json(
        { error: "Scheme employer country is not supported in this market" },
        { status: 400 }
      );
    }

    if (
      schemeCurrency.toUpperCase() !== schemeCountryConfig.currency
    ) {
      return NextResponse.json(
        { error: "Scheme employer currency does not match employer country" },
        { status: 400 }
      );
    }

    const stripeFeeProfile = requireStripeFeeProfile(
      activeMarket.market,
      schemeCountryConfig.currency
    );

    console.log(
      "🔵 Scheme payment → using EMPLOYER fee/currency/pricing:",
      feePercent,
      schemeCurrency,
      stripeFeeProfile.pricingKey
    );

    const paymentBreakdown = calculatePaymentAmount({
      tipAmountCents: amountCents,
      feePercent,
      coverFees,
      stripeFeeProfile,
    });

    const intent = await stripe.paymentIntents.create({
      amount: paymentBreakdown.paymentAmountCents,
      currency: schemeCurrency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        earner_id: "",
        employer_id: resolvedEmployerId,
        scheme_id: schemeId,
        rating: normalizedRating ?? "",
        review_text: normalizedReviewText,
        fee_percent: String(feePercent),
        stripe_fee_pricing_key: stripeFeeProfile.pricingKey,
        tip_amount_cents: String(paymentBreakdown.tipAmountCents),
        fee_coverage_cents: String(paymentBreakdown.feeCoverageCents),
        cover_fees: String(coverFees),
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
