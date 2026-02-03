import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const APP_MIN_PAYOUT: Record<string, number> = {
  chf: 500,
  eur: 100,
  usd: 100,
};

const STRIPE_MIN_PAYOUT: Record<string, number> = {
  chf: 500,
  eur: 100,
  usd: 100,
};

function getMonthKey(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'missing_account_id' },
        { status: 400 }
      );
    }

    // 1) Find earner by stripe_account_id
    const { data: earner, error: earnerErr } = await supabaseAdmin
      .from('profiles_earner')
      .select('id, stripe_account_id, stripe_status')
      .eq('stripe_account_id', accountId)
      .maybeSingle();

    if (earnerErr) {
      console.error('Earner lookup error:', earnerErr);
      return NextResponse.json(
        { error: 'db_error_earner_lookup' },
        { status: 500 }
      );
    }

    if (!earner) {
      return NextResponse.json(
        { error: 'earner_not_found' },
        { status: 404 }
      );
    }

    if (earner.stripe_status === 'deleted') {
      return NextResponse.json(
        { error: 'stripe_account_deleted' },
        { status: 400 }
      );
    }

    // 2) Stripe balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    const mainAvailable = balance.available?.[0];

    if (!mainAvailable || mainAvailable.amount <= 0) {
      return NextResponse.json({
        currency: mainAvailable?.currency?.toUpperCase() ?? null,
        available_cents: mainAvailable?.amount ?? 0,
        can_payout: false,
        reason: 'no_available_balance',
        fee_cents: 0,
        payout_amount_cents: 0,
        isFirstPayoutThisMonth: false,
        monthKey: getMonthKey(),
      });
    }

    const currency = mainAvailable.currency;
    const currencyUpper = currency.toUpperCase();

    const stripeMin = STRIPE_MIN_PAYOUT[currency] ?? 0;
    const appMin = APP_MIN_PAYOUT[currency] ?? stripeMin;

    const monthKey = getMonthKey(new Date());

    // 3) monthly_active exists?
    const { data: existingMonthlyFee, error: feeLookupErr } = await supabaseAdmin
      .from('payout_fees_log')
      .select('id')
      .eq('role', 'earner')
      .eq('user_id', earner.id)
      .eq('month_key', monthKey)
      .eq('fee_type', 'monthly_active')
      .limit(1);

    if (feeLookupErr) {
      console.error('Monthly fee lookup error:', feeLookupErr);
      return NextResponse.json(
        { error: 'db_error_fee_lookup' },
        { status: 500 }
      );
    }

    const isFirstPayoutThisMonth =
      !existingMonthlyFee || existingMonthlyFee.length === 0;

    // Fee calculation
    const monthlyActiveFee = isFirstPayoutThisMonth ? 200 : 0;
    const payoutFee = 55;
    const feeCents = monthlyActiveFee + payoutFee;

    // payout possible?
    if (mainAvailable.amount < stripeMin) {
      return NextResponse.json({
        currency: currencyUpper,
        available_cents: mainAvailable.amount,
        can_payout: false,
        reason: 'below_stripe_min',
        stripe_min_cents: stripeMin,
        app_min_cents: appMin,
        fee_cents: feeCents,
        payout_amount_cents: 0,
        isFirstPayoutThisMonth,
        monthKey,
      });
    }

    if (mainAvailable.amount < appMin) {
      return NextResponse.json({
        currency: currencyUpper,
        available_cents: mainAvailable.amount,
        can_payout: false,
        reason: 'below_app_min',
        stripe_min_cents: stripeMin,
        app_min_cents: appMin,
        fee_cents: feeCents,
        payout_amount_cents: 0,
        isFirstPayoutThisMonth,
        monthKey,
      });
    }

    if (mainAvailable.amount <= feeCents) {
      return NextResponse.json({
        currency: currencyUpper,
        available_cents: mainAvailable.amount,
        can_payout: false,
        reason: 'fee_exceeds_amount',
        stripe_min_cents: stripeMin,
        app_min_cents: appMin,
        fee_cents: feeCents,
        payout_amount_cents: 0,
        isFirstPayoutThisMonth,
        monthKey,
      });
    }

    const payoutAmount = mainAvailable.amount - feeCents;

    if (payoutAmount < stripeMin) {
      return NextResponse.json({
        currency: currencyUpper,
        available_cents: mainAvailable.amount,
        can_payout: false,
        reason: 'below_stripe_min_after_fee',
        stripe_min_cents: stripeMin,
        app_min_cents: appMin,
        fee_cents: feeCents,
        payout_amount_cents: payoutAmount,
        isFirstPayoutThisMonth,
        monthKey,
      });
    }

    return NextResponse.json({
      currency: currencyUpper,
      available_cents: mainAvailable.amount,
      can_payout: true,
      reason: null,
      stripe_min_cents: stripeMin,
      app_min_cents: appMin,
      fee_cents: feeCents,
      payout_amount_cents: payoutAmount,
      isFirstPayoutThisMonth,
      monthKey,
      breakdown: {
        monthly_active_fee_cents: monthlyActiveFee,
        payout_fee_cents: payoutFee,
      },
    });
  } catch (e: any) {
    console.error('GET /earners/payout-fee-preview error:', e);
    return NextResponse.json(
      { error: 'preview_failed' },
      { status: 500 }
    );
  }
}
