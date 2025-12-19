// src/app/api/earners/stripe-dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const appUrl = process.env.NEXT_PUBLIC_APP_URL as string;

export async function POST(req: NextRequest) {
  const { accountId, chargesEnabled } = await req.json();

  if (!accountId) {
    return NextResponse.json(
      { error: "Missing accountId" },
      { status: 400 }
    );
  }

  try {
    // ✅ ЕСЛИ ПЛАТЕЖИ УЖЕ ВКЛЮЧЕНЫ → DASHBOARD
    if (chargesEnabled === true) {
      const loginLink = await stripe.accounts.createLoginLink(accountId);

      return NextResponse.json({
        url: loginLink.url,
        type: "dashboard",
      });
    }
    // ❌ ПЛАТЕЖИ ЕЩЁ НЕ ГОТОВЫ → ONBOARDING / CONTINUE SETUP
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
