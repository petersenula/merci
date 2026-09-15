import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { calculatePaymentAmount } from "@/lib/paymentFeeGrossUp";
import { getActiveMarketConfig, getCountryConfig } from "@/lib/marketConfig";
import { requireStripeFeeProfile } from "@/lib/stripeFeeConfig";

export const runtime = "nodejs";

const MIN_CENTS = 100;
const MAX_CENTS = 1_000_000;

const activeMarket = getActiveMarketConfig();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      tipAmountCents,
      slug,
      schemeId,
      coverFees,
    } = body;

    if (
      typeof tipAmountCents !== "number" ||
      !Number.isInteger(tipAmountCents) ||
      tipAmountCents < MIN_CENTS ||
      tipAmountCents > MAX_CENTS
    ) {
      return NextResponse.json(
        { error: "Invalid tip amount" },
        { status: 400 }
      );
    }

    if (typeof coverFees !== "boolean") {
      return NextResponse.json(
        { error: "coverFees must be boolean" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    let feePercent: number;
    let accountCountryCode: string;
    let accountCurrency: string;

    // ============================================================
    // SCHEME PAYMENT
    // ============================================================
    if (schemeId) {
      if (typeof schemeId !== "string") {
        return NextResponse.json(
          { error: "Invalid schemeId" },
          { status: 400 }
        );
      }

      const { data: scheme, error: schemeError } = await supabase
        .from("allocation_schemes")
        .select("employer_id")
        .eq("id", schemeId)
        .maybeSingle();

      if (schemeError || !scheme?.employer_id) {
        return NextResponse.json(
          { error: "Payment scheme not found" },
          { status: 404 }
        );
      }

      const { data: employer, error: employerError } = await supabase
        .from("employers")
        .select("platform_fee_percent, is_active, country_code, currency")
        .eq("user_id", scheme.employer_id)
        .maybeSingle();

      if (
        employerError ||
        !employer ||
        employer.is_active !== true
      ) {
        return NextResponse.json(
          { error: "Payment scheme unavailable" },
          { status: 404 }
        );
      }

      feePercent = Number(
        employer.platform_fee_percent ?? 5
      );
      accountCountryCode = String(employer.country_code ?? "").toUpperCase();
      accountCurrency = String(employer.currency ?? "").toUpperCase();
    }

    // ============================================================
    // DIRECT PAYMENT
    // ============================================================
    else {
      if (typeof slug !== "string" || !slug.trim()) {
        return NextResponse.json(
          { error: "Missing payment page slug" },
          { status: 400 }
        );
      }

      const normalizedSlug = slug.trim();

      const { data: worker, error: workerError } = await supabase
        .from("profiles_earner")
        .select("platform_fee_percent, country_code, currency")
        .eq("slug", normalizedSlug)
        .eq("is_active", true)
        .maybeSingle<{
          platform_fee_percent: number | null;
          country_code: string | null;
          currency: string;
        }>();

      if (workerError) {
        console.error(
          "Fee preview worker lookup failed:",
          workerError
        );

        return NextResponse.json(
          { error: "Failed to resolve payment recipient" },
          { status: 500 }
        );
      }

      if (worker) {
        feePercent = Number(
          worker.platform_fee_percent ?? 5
        );
        accountCountryCode = String(worker.country_code ?? "").toUpperCase();
        accountCurrency = String(worker.currency ?? "").toUpperCase();
      } else {
        const { data: employer, error: employerError } =
          await supabase
            .from("employers")
            .select("platform_fee_percent, country_code, currency")
            .eq("slug", normalizedSlug)
            .eq("is_active", true)
            .maybeSingle<{
              platform_fee_percent: number | null;
              country_code: string;
              currency: string;
            }>();

        if (employerError) {
          console.error(
            "Fee preview employer lookup failed:",
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

        feePercent = Number(
          employer.platform_fee_percent ?? 5
        );
        accountCountryCode = String(employer.country_code ?? "").toUpperCase();
        accountCurrency = String(employer.currency ?? "").toUpperCase();
      }
    }

    if (!accountCountryCode || !accountCurrency) {
      return NextResponse.json(
        { error: "Recipient country or currency is not configured" },
        { status: 400 }
      );
    }

    const countryConfig = getCountryConfig(
      activeMarket.market,
      accountCountryCode
    );

    if (!countryConfig) {
      return NextResponse.json(
        { error: "Recipient country is not supported in this market" },
        { status: 400 }
      );
    }

    if (accountCurrency !== countryConfig.currency) {
      return NextResponse.json(
        { error: "Recipient currency does not match recipient country" },
        { status: 400 }
      );
    }

    const stripeFeeProfile = requireStripeFeeProfile(
      activeMarket.market,
      countryConfig.currency
    );

    const breakdown = calculatePaymentAmount({
      tipAmountCents,
      feePercent,
      coverFees,
      stripeFeeProfile,
    });

    return NextResponse.json({
      tipAmountCents: breakdown.tipAmountCents,
      paymentAmountCents: breakdown.paymentAmountCents,
      feeCoverageCents: breakdown.feeCoverageCents,
      currency: countryConfig.currency,
      stripeFeePricingKey: stripeFeeProfile.pricingKey,
    });
  } catch (error) {
    console.error("Payment fee preview error:", error);

    return NextResponse.json(
      { error: "Failed to calculate payment fee" },
      { status: 500 }
    );
  }
}
