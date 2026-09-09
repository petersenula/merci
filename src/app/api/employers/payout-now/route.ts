import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authenticateApiRequest } from '@/lib/authenticateApiRequest';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  claimManualPayoutRequest,
  getManualPayoutRequest,
  hasCollectedMonthlyPayoutFee,
  updateManualPayoutRequest,
} from '@/lib/manualPayoutRequest';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ============================
// APP RULES (our own rules)
// ============================

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

const PAYOUT_FEE_CENTS_FIRST_MONTH = 255; // 2.55 CHF
const PAYOUT_FEE_CENTS_NEXT = 55; // 0.55 CHF

function getMonthKey(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const requestId = new URL(req.url).searchParams.get('requestId');

    if (
      typeof requestId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        requestId
      )
    ) {
      return NextResponse.json(
        { error: 'invalid_payout_request_id' },
        { status: 400 }
      );
    }

    const request = await getManualPayoutRequest(
      getSupabaseAdmin(),
      requestId,
      'employer',
      user.id
    );

    if (!request) {
      return NextResponse.json(
        { error: 'payout_request_not_found' },
        { status: 404 }
      );
    }

    if (request.status === 'processing') {
      return NextResponse.json(
        {
          status: 'processing',
          retry_after_ms: 3000,
          retry_with_new_request: false,
        },
        { status: 202 }
      );
    }

    if (request.status === 'failed') {
      return NextResponse.json(
        {
          error: request.error_code ?? 'payout_request_failed',
          retry_with_new_request: true,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      payoutId: request.stripe_payout_id,
      status: 'succeeded',
      currency: request.currency?.toUpperCase() ?? null,
      fee_cents: request.fee_cents,
      payout_amount_cents: request.payout_amount_cents,
      monthKey: request.month_key,
      idempotent_replay: true,
      fee_charge_id: request.stripe_fee_charge_id,
    });
  } catch (error) {
    console.error('GET /employers/payout-now error:', error);
    return NextResponse.json(
      { error: 'payout_status_failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const requestId = body?.requestId;

    if (
      typeof requestId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        requestId
      )
    ) {
      return NextResponse.json(
        { error: 'invalid_payout_request_id' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (!process.env.STRIPE_PLATFORM_ACCOUNT_ID) {
      console.error('Missing STRIPE_PLATFORM_ACCOUNT_ID env');
      return NextResponse.json(
        { error: 'missing_platform_account_id' },
        { status: 500 }
      );
    }

    // 1) Resolve the employer from the authenticated user
    const { data: employer, error: employerErr } = await supabaseAdmin
      .from('employers')
      .select('user_id, stripe_account_id, stripe_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (employerErr) {
      console.error('Employer lookup error:', employerErr);
      return NextResponse.json(
        { error: 'db_error_employer_lookup' },
        { status: 500 }
      );
    }

    if (!employer) {
      return NextResponse.json(
        { error: 'employer_not_found' },
        { status: 404 }
      );
    }

    if (!employer.stripe_account_id) {
      return NextResponse.json(
        { error: 'missing_stripe_account' },
        { status: 400 }
      );
    }

    const accountId = employer.stripe_account_id;

    if (employer.stripe_status === 'deleted') {
      return NextResponse.json(
        { error: 'stripe_account_deleted' },
        { status: 400 }
      );
    }

    // 2) Get balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    const mainAvailable = balance.available?.[0];

    if (!mainAvailable || mainAvailable.amount <= 0) {
      return NextResponse.json(
        { error: 'no_available_balance' },
        { status: 400 }
      );
    }

    const currency = mainAvailable.currency; // lowercase
    const currencyUpper = currency.toUpperCase();

    // 3) Stripe minimum payout check
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

    // 4) App minimum payout check
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

    // 5) Determine if first payout this month
    const monthKey = getMonthKey(new Date());

    let monthlyFeeCollected: boolean;

    try {
      monthlyFeeCollected = await hasCollectedMonthlyPayoutFee(
        supabaseAdmin,
        'employer',
        employer.user_id,
        monthKey
      );
    } catch (feeLookupError) {
      console.error('Monthly fee lookup error:', feeLookupError);
      return NextResponse.json(
        { error: 'db_error_fee_lookup' },
        { status: 500 }
      );
    }

    const isFirstPayoutThisMonth = !monthlyFeeCollected;

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

    // 7) Atomically claim this payout request before Stripe side effects
    const claim = await claimManualPayoutRequest({
      supabaseAdmin,
      requestId,
      role: 'employer',
      userId: employer.user_id,
      stripeAccountId: accountId,
      monthKey,
      currency,
      feeCents,
      payoutAmountCents: payoutAmount,
    });

    if (!claim.ok) {
      if (claim.reason === 'already_succeeded') {
        return NextResponse.json({
          payoutId: claim.request.stripe_payout_id,
          status: 'succeeded',
          currency: claim.request.currency?.toUpperCase() ?? currencyUpper,
          fee_cents: claim.request.fee_cents,
          payout_amount_cents: claim.request.payout_amount_cents,
          monthKey: claim.request.month_key,
          idempotent_replay: true,
          fee_charge_id: claim.request.stripe_fee_charge_id,
        });
      }

      if (claim.reason === 'already_failed') {
        return NextResponse.json(
          {
            error: claim.request.error_code ?? 'payout_request_failed',
            retry_with_new_request: true,
          },
          { status: 409 }
        );
      }

      if (claim.reason === 'already_processing') {
        return NextResponse.json(
          {
            status: 'processing',
            retry_after_ms: 3000,
            retry_with_new_request: false,
          },
          { status: 202 }
        );
      }

      if (claim.reason === 'database_error') {
        return NextResponse.json(
          { error: 'payout_request_database_error' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'payout_request_already_exists' },
        { status: 409 }
      );
    }

    // 8) Collect the platform fee from the connected Stripe balance first
    let feeCharge: Stripe.Charge;

    try {
      feeCharge = await stripe.charges.create(
        {
          amount: feeCents,
          currency,
          source: accountId,
          description: `click4tip payout fee (${monthKey})`,
          metadata: {
            role: 'employer',
            user_id: employer.user_id,
            month_key: monthKey,
            payout_request_id: requestId,
            fee_cents: String(feeCents),
            is_first_payout_this_month: String(isFirstPayoutThisMonth),
          },
        },
        {
          idempotencyKey: `manual_payout_fee_${requestId}`,
        }
      );
    } catch (feeError) {
      console.error('Account debit fee collection failed:', feeError);

      const feeResultUnknown =
        feeError instanceof Stripe.errors.StripeConnectionError ||
        feeError instanceof Stripe.errors.StripeAPIError;

      await updateManualPayoutRequest(
        supabaseAdmin,
        requestId,
        'employer',
        employer.user_id,
        {
          status: feeResultUnknown ? 'processing' : 'failed',
          error_code: feeResultUnknown
            ? 'fee_collection_result_unknown'
            : 'fee_collection_failed',
          next_retry_at: feeResultUnknown
            ? new Date(Date.now() + 15_000).toISOString()
            : null,
          processing_expires_at: feeResultUnknown
            ? new Date(Date.now() + 30 * 60_000).toISOString()
            : new Date().toISOString(),
        }
      );

      if (feeResultUnknown) {
        return NextResponse.json(
          {
            status: 'processing',
            retry_after_ms: 3000,
            retry_with_new_request: false,
          },
          { status: 202 }
        );
      }

      return NextResponse.json(
        {
          error: 'fee_collection_failed',
          retry_with_new_request: true,
        },
        { status: 500 }
      );
    }

    const feeStateError = await updateManualPayoutRequest(
      supabaseAdmin,
      requestId,
      'employer',
      employer.user_id,
      {
        stripe_fee_charge_id: feeCharge.id,
        error_code: null,
      }
    );

    if (feeStateError) {
      let feeRefund: Stripe.Refund | null = null;

      try {
        feeRefund = await stripe.refunds.create(
          {
            charge: feeCharge.id,
            metadata: {
              payout_request_id: requestId,
              reason: 'fee_state_persistence_failed',
            },
          },
          {
            idempotencyKey: `manual_payout_fee_refund_${requestId}`,
          }
        );
      } catch (refundError) {
        console.error(
          'Account debit refund after state failure failed:',
          refundError
        );
      }

      await updateManualPayoutRequest(
        supabaseAdmin,
        requestId,
        'employer',
        employer.user_id,
        {
          status: feeRefund ? 'failed' : 'processing',
          stripe_fee_refund_id: feeRefund?.id ?? null,
          error_code: feeRefund
            ? 'fee_state_persistence_failed'
            : 'fee_refund_pending',
          next_retry_at: feeRefund
            ? null
            : new Date(Date.now() + 15_000).toISOString(),
        }
      );

      return NextResponse.json(
        feeRefund
          ? {
              error: 'fee_state_persistence_failed',
              retry_with_new_request: true,
            }
          : {
              status: 'processing',
              retry_after_ms: 3000,
              retry_with_new_request: false,
            },
        { status: feeRefund ? 500 : 202 }
      );
    }

    // 9) Create the bank payout only after the fee was collected
    let payout: Stripe.Payout;

    try {
      payout = await stripe.payouts.create(
        {
          amount: payoutAmount,
          currency,
          metadata: {
            payout_request_id: requestId,
            fee_charge_id: feeCharge.id,
          },
        },
        {
          stripeAccount: accountId,
          idempotencyKey: `manual_payout_${requestId}`,
        }
      );
    } catch (payoutError) {
      console.error('Payout failed after fee collection:', payoutError);

      const payoutResultUnknown =
        payoutError instanceof Stripe.errors.StripeConnectionError ||
        payoutError instanceof Stripe.errors.StripeAPIError;

      if (payoutResultUnknown) {
        await updateManualPayoutRequest(
          supabaseAdmin,
          requestId,
          'employer',
          employer.user_id,
          {
            status: 'processing',
            error_code: 'payout_result_unknown',
            next_retry_at: new Date(Date.now() + 15_000).toISOString(),
            processing_expires_at: new Date(
              Date.now() + 30 * 60_000
            ).toISOString(),
          }
        );

        return NextResponse.json(
          {
            status: 'processing',
            retry_after_ms: 3000,
            retry_with_new_request: false,
          },
          { status: 202 }
        );
      }

      let feeRefund: Stripe.Refund | null = null;

      try {
        feeRefund = await stripe.refunds.create(
          {
            charge: feeCharge.id,
            metadata: {
              payout_request_id: requestId,
              reason: 'payout_failed',
            },
          },
          {
            idempotencyKey: `manual_payout_fee_refund_${requestId}`,
          }
        );
      } catch (refundError) {
        console.error(
          'Account debit refund after payout failure failed:',
          refundError
        );
      }

      await updateManualPayoutRequest(
        supabaseAdmin,
        requestId,
        'employer',
        employer.user_id,
        {
          status: feeRefund ? 'failed' : 'processing',
          stripe_fee_refund_id: feeRefund?.id ?? null,
          error_code: feeRefund
            ? 'payout_failed_fee_refunded'
            : 'fee_refund_pending',
          next_retry_at: feeRefund
            ? null
            : new Date(Date.now() + 15_000).toISOString(),
        }
      );

      return NextResponse.json(
        feeRefund
          ? {
              error: 'payout_failed_fee_refunded',
              retry_with_new_request: true,
            }
          : {
              status: 'processing',
              retry_after_ms: 3000,
              retry_with_new_request: false,
            },
        { status: feeRefund ? 500 : 202 }
      );
    }

    // 10) Log only a fee that Stripe actually collected
    const feeRows: any[] = [];

    if (isFirstPayoutThisMonth) {
      feeRows.push({
        role: 'employer',
        user_id: employer.user_id,
        stripe_account_id: accountId,
        month_key: monthKey,
        fee_type: 'monthly_active',
        amount_cents: 200,
        currency: currencyUpper,
        stripe_payout_id: payout.id,
        meta: {
          note: 'First payout of month: active account fee',
          fee_charge_id: feeCharge.id,
        },
      });
    }

    feeRows.push({
      role: 'employer',
      user_id: employer.user_id,
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
        fee_charge_id: feeCharge.id,
      },
    });

    const { error: insertErr } = await supabaseAdmin
      .from('payout_fees_log')
      .insert(feeRows);

    if (insertErr) {
      console.error('Fee log insert error:', insertErr);
    }

    const requestUpdateError = await updateManualPayoutRequest(
      supabaseAdmin,
      requestId,
      'employer',
      employer.user_id,
      {
        status: 'succeeded',
        stripe_payout_id: payout.id,
        stripe_fee_charge_id: feeCharge.id,
        error_code: insertErr ? 'fee_log_insert_failed' : null,
      }
    );

    if (requestUpdateError) {
      console.error(
        'Payout succeeded but request completion could not be persisted'
      );
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
      fee_charge_id: feeCharge.id,
    });
  } catch (e: any) {
    console.error('POST /employers/payout-now error:', e);

    if (e?.code === 'amount_too_small') {
      return NextResponse.json(
        { error: 'amount_too_small' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'payout_failed' }, { status: 500 });
  }
}
