import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { authenticateApiRequest } from "@/lib/authenticateApiRequest";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

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

    const { data: employer, error: employerError } = await supabaseAdmin
      .from("employers")
      .select("stripe_account_id, stripe_charges_enabled, stripe_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (employerError) {
      console.error("Employer lookup error:", employerError);
      return NextResponse.json(
        { error: "Failed to load employer profile" },
        { status: 500 }
      );
    }

    if (!employer) {
      return NextResponse.json(
        { error: "Employer profile not found" },
        { status: 404 }
      );
    }

    if (!employer.stripe_account_id) {
      return NextResponse.json(
        { error: "Missing Stripe account" },
        { status: 400 }
      );
    }

    if (employer.stripe_status === "deleted") {
      return NextResponse.json(
        { error: "Stripe account deleted" },
        { status: 400 }
      );
    }

    const accountId = employer.stripe_account_id;
    const chargesEnabled = employer.stripe_charges_enabled === true;

    if (chargesEnabled) {
      const loginLink = await stripe.accounts.createLoginLink(accountId);

      return NextResponse.json({
        url: loginLink.url,
        type: "dashboard",
      });
    }

    const onboardingLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/employers/profile?tab=schemes`,
      return_url: `${appUrl}/employers/profile?tab=schemes`,
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
