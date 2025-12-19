import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Stripe minimum payout amounts (in minor units)
 * IMPORTANT: these are Stripe rules, not our app rules
 */
const STRIPE_MIN_PAYOUT: Record<string, number> = {
  chf: 500, // 5.00 CHF — confirmed by Stripe
  eur: 100, // 1.00 EUR
  usd: 100, // 1.00 USD
};

export async function POST(req: NextRequest) {
  try {
    const { accountId } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'missing_account_id' },
        { status: 400 }
      );
    }

    // 1️⃣ Get balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    const mainAvailable = balance.available[0];

    if (!mainAvailable || mainAvailable.amount <= 0) {
      return NextResponse.json(
        { error: 'no_available_balance' },
        { status: 400 }
      );
    }

    const currency = mainAvailable.currency;
    const minPayout = STRIPE_MIN_PAYOUT[currency] ?? 0;

    // 2️⃣ Stripe minimum payout check (BEFORE calling payouts.create)
    if (mainAvailable.amount < minPayout) {
      return NextResponse.json(
        {
          error: 'amount_too_small',
          currency,
          minimum: minPayout,
          available: mainAvailable.amount,
        },
        { status: 400 }
      );
    }

    // 3️⃣ Create payout in balance currency
    const payout = await stripe.payouts.create(
      {
        amount: mainAvailable.amount,
        currency,
      },
      { stripeAccount: accountId }
    );

    return NextResponse.json({
      payoutId: payout.id,
      status: payout.status,
    });
  } catch (e: any) {
    console.error('POST /employers/payout-now error:', e);

    // 4️⃣ Explicit Stripe error handling
    if (e?.code === 'amount_too_small') {
      return NextResponse.json(
        { error: 'amount_too_small' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'payout_failed' },
      { status: 500 }
    );
  }
}
