import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_MIN_PAYOUT: Record<string, number> = {
  chf: 500,
  eur: 100,
  usd: 100,
};

const APP_MIN_PAYOUT: Record<string, number> = {
  chf: 500,
  eur: 100,
  usd: 100,
};

const PAYOUT_FEE_CENTS_FIRST_MONTH = 255;
const PAYOUT_FEE_CENTS_NEXT = 55;

function getMonthKey(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { accountId } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'missing_account_id' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_PLATFORM_ACCOUNT_ID) {
      console.error('Missing STRIPE_PLATFORM_ACCOUNT_ID env');
      return NextResponse.json(
        { error: 'missing_platform_account_id' },
        { status: 500 }
      );
    }

    // 1) Find earner
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
      return NextResponse.json({ error: 'earner_not_found' }, { status: 404 });
    }

    if (!earner.stripe_account_id) {
      return NextResponse.json(
        { error: 'missing_stripe_account' },
        { status: 400 }
      );
    }

    if (earner.stripe_status === 'deleted') {
      return NextResponse.json(
        { error: 'stripe_account_deleted' },
        { status: 400 }
      );
    }

    // 2) Balance + account
    const [balance, account] = await Promise.all([
      stripe.balance.retrieve({ stripeAccount: accountId }),
      stripe.accounts.retrieve(accountId),
    ]);

    const mainAvailable = balance.available?.[0];

    if (!mainAvailable || mainAvailable.amount <= 0) {
      return NextResponse.json(
        { error: 'no_available_balance' },
        { status: 400 }
      );
    }

    const currency = mainAvailable.currency; // lowercase
    const currencyUpper = currency.toUpperCase();

    const payoutCurrency =
      ((account as any).metadata?.payouts_currency as string) ??
      mainAvailable.currency;

    // 3) Stripe min payout
    const stripeMin = STRIPE_MIN_PAYOUT[currency] ?? 0;
    if (mainAvailable.amount < stripeMin) {
      return NextResponse.json(
        {
          error: 'amount_too_small_stripe',
          currency: currencyUpper,
          minimum: stripeMin,
          available: mainAvailable.amount,
        },
        { status: 400 }
      );
    }

    // 4) App min payout
    const appMin = APP_MIN_PAYOUT[currency] ?? stripeMin;
    if (mainAvailable.amount < appMin) {
      return NextResponse.json(
        {
          error: 'amount_too_small_app',
          currency: currencyUpper,
          minimum: appMin,
          available: mainAvailable.amount,
        },
        { status: 400 }
      );
    }

    // 5) First payout this month?
    const monthKey = getMonthKey(new Date());

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

    // 6) Fee + payout amount
    const feeCents = isFirstPayoutThisMonth
      ? PAYOUT_FEE_CENTS_FIRST_MONTH
      : PAYOUT_FEE_CENTS_NEXT;

    if (mainAvailable.amount <= feeCents) {
      return NextResponse.json(
        {
          error: 'fee_exceeds_amount',
          currency: currencyUpper,
          available: mainAvailable.amount,
          fee: feeCents,
        },
        { status: 400 }
      );
    }

    const payoutAmount = mainAvailable.amount - feeCents;

    if (payoutAmount < stripeMin) {
      return NextResponse.json(
        {
          error: 'payout_amount_too_small_after_fee',
          currency: currencyUpper,
          minimum: stripeMin,
          available: mainAvailable.amount,
          fee: feeCents,
          payoutAmount,
        },
        { status: 400 }
      );
    }

    // 7) Create payout
    const payout = await stripe.payouts.create(
      {
        amount: payoutAmount,
        currency: payoutCurrency,
      },
      { stripeAccount: accountId }
    );

    // 7.5) Transfer fee to PLATFORM (so it does NOT stay in connected balance)
    let feeTransfer: Stripe.Transfer | null = null;

    try {
      feeTransfer = await stripe.transfers.create(
        {
          amount: feeCents,
          currency: payoutCurrency,
          destination: process.env.STRIPE_PLATFORM_ACCOUNT_ID,
          description: `click4tip payout fee (${monthKey})`,
          metadata: {
            role: 'earner',
            user_id: earner.id,
            month_key: monthKey,
            stripe_payout_id: payout.id,
            fee_cents: String(feeCents),
            is_first_payout_this_month: String(isFirstPayoutThisMonth),
          },
        },
        { stripeAccount: accountId }
      );
    } catch (transferErr) {
      console.error('Fee transfer failed:', transferErr);

      // payout already succeeded => return success, but warn
      // IMPORTANT: in production you may want to alert admin here
    }

    // 8) Log fees
    const feeRows: any[] = [];

    if (isFirstPayoutThisMonth) {
      feeRows.push({
        role: 'earner',
        user_id: earner.id,
        stripe_account_id: accountId,
        month_key: monthKey,
        fee_type: 'monthly_active',
        amount_cents: 200,
        currency: currencyUpper,
        stripe_payout_id: payout.id,
        meta: {
          note: 'First payout of month: active account fee',
          fee_transfer_id: feeTransfer?.id ?? null,
        },
      });
    }

    feeRows.push({
      role: 'earner',
      user_id: earner.id,
      stripe_account_id: accountId,
      month_key: monthKey,
      fee_type: 'payout',
      amount_cents: 55,
      currency: currencyUpper,
      stripe_payout_id: payout.id,
      meta: {
        note: isFirstPayoutThisMonth
          ? 'First payout of month: payout fee'
          : 'Payout fee',
        fee_transfer_id: feeTransfer?.id ?? null,
      },
    });

    const { error: insertErr } = await supabaseAdmin
      .from('payout_fees_log')
      .insert(feeRows);

    if (insertErr) {
      console.error('Fee log insert error:', insertErr);
    }

    return NextResponse.json({
      payoutId: payout.id,
      status: payout.status,
      currency: currencyUpper,
      available_before_fee: mainAvailable.amount,
      fee_cents: feeCents,
      payout_amount_cents: payoutAmount,
      monthKey,
      isFirstPayoutThisMonth,
      fee_transfer_id: feeTransfer?.id ?? null,
    });
  } catch (e: any) {
    console.error('POST /earners/payout-now error:', e);

    return NextResponse.json({ error: 'payout_failed' }, { status: 500 });
  }
}
