import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

export async function POST(req: NextRequest) {
  const { accountId, chargesEnabled } = await req.json();

  if (!accountId) {
    return NextResponse.json(
      { error: "Missing accountId" },
      { status: 400 }
    );
  }

  try {
    // ✅ Если платежи уже включены — открываем Dashboard
    if (chargesEnabled === true) {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return NextResponse.json({
        url: loginLink.url,
        type: "dashboard",
      });
    }

    // ❌ Если платежи ещё не готовы — продолжаем onboarding
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
