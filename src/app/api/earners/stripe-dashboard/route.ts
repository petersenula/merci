// src/app/api/earners/stripe-dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { authenticateApiRequest } from "@/lib/authenticateApiRequest";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const appUrl = process.env.NEXT_PUBLIC_APP_URL as string;

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: earner, error: earnerError } = await supabaseAdmin
      .from("profiles_earner")
      .select("stripe_account_id, stripe_charges_enabled, stripe_status")
      .eq("id", user.id)
      .maybeSingle();

    if (earnerError) {
      console.error("Earner lookup error:", earnerError);
      return NextResponse.json(
        { error: "Failed to load earner profile" },
        { status: 500 }
      );
    }

    if (!earner) {
      return NextResponse.json(
        { error: "Earner profile not found" },
        { status: 404 }
      );
    }

    if (!earner.stripe_account_id) {
      return NextResponse.json(
        { error: "Missing Stripe account" },
        { status: 400 }
      );
    }

    if (earner.stripe_status === "deleted") {
      return NextResponse.json(
        { error: "Stripe account deleted" },
        { status: 400 }
      );
    }

    const accountId = earner.stripe_account_id;
    const chargesEnabled = earner.stripe_charges_enabled === true;

    if (chargesEnabled) {
      const loginLink = await stripe.accounts.createLoginLink(accountId);

      return NextResponse.json({
        url: loginLink.url,
        type: "dashboard",
      });
    }

    const onboardingLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/earners/profile?tab=qr`,
      return_url: `${appUrl}/earners/profile?tab=qr`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: onboardingLink.url,
      type: "onboarding",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to get Stripe link" },
      { status: 500 }
    );
  }
}
