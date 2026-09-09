import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type PayoutRequest = {
  request_id: string;
  role: 'earner' | 'employer';
  user_id: string;
  stripe_account_id: string;
  status: 'processing';
  month_key: string;
  currency: string;
  fee_cents: number;
  payout_amount_cents: number;
  stripe_fee_charge_id: string | null;
  stripe_fee_refund_id: string | null;
  stripe_payout_id: string | null;
  error_code: string | null;
  retry_count: number;
  next_retry_at: string | null;
};

const REQUEST_COLUMNS = [
  'request_id',
  'role',
  'user_id',
  'stripe_account_id',
  'status',
  'month_key',
  'currency',
  'fee_cents',
  'payout_amount_cents',
  'stripe_fee_charge_id',
  'stripe_fee_refund_id',
  'stripe_payout_id',
  'error_code',
  'retry_count',
  'next_retry_at',
].join(',');

function isAmbiguousStripeError(error: unknown) {
  return (
    error instanceof Stripe.errors.StripeConnectionError ||
    error instanceof Stripe.errors.StripeAPIError
  );
}

function nextRetryIso(retryCount: number) {
  const delaySeconds = Math.min(15 * 2 ** retryCount, 15 * 60);
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

async function updateRequest(
  request: PayoutRequest,
  values: Record<string, unknown>
) {
  const supabaseAdmin = getSupabaseAdmin();

  const { error } = await supabaseAdmin
    .from('payout_requests')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('request_id', request.request_id)
    .eq('role', request.role)
    .eq('user_id', request.user_id);

  if (error) {
    throw new Error(`Payout request update failed: ${error.message}`);
  }
}

async function scheduleRetry(
  request: PayoutRequest,
  errorCode: string
) {
  await updateRequest(request, {
    status: 'processing',
    error_code: errorCode,
    next_retry_at: nextRetryIso(request.retry_count + 1),
    processing_expires_at: new Date(
      Date.now() + 30 * 60_000
    ).toISOString(),
  });
}

async function refundCollectedFee(
  request: PayoutRequest,
  feeChargeId: string,
  failureCode: string
) {
  try {
    const refund = await stripe.refunds.create(
      {
        charge: feeChargeId,
        metadata: {
          payout_request_id: request.request_id,
          reason: failureCode,
        },
      },
      {
        idempotencyKey:
          `manual_payout_fee_refund_${request.request_id}`,
      }
    );

    await updateRequest(request, {
      status: 'failed',
      stripe_fee_refund_id: refund.id,
      error_code: failureCode,
      next_retry_at: null,
    });
  } catch (error) {
    console.error('Automatic payout fee refund failed:', error);

    await scheduleRetry(request, 'fee_refund_pending');
  }
}

async function logCollectedFee(
  request: PayoutRequest,
  feeChargeId: string,
  payoutId: string
) {
  const supabaseAdmin = getSupabaseAdmin();
  const isFirstPayoutThisMonth = request.fee_cents === 255;

  const feeRows: Array<Record<string, unknown>> = [];

  if (isFirstPayoutThisMonth) {
    feeRows.push({
      role: request.role,
      user_id: request.user_id,
      stripe_account_id: request.stripe_account_id,
      month_key: request.month_key,
      fee_type: 'monthly_active',
      amount_cents: 200,
      currency: request.currency.toUpperCase(),
      stripe_payout_id: payoutId,
      meta: {
        note: 'First payout of month: active account fee',
        fee_charge_id: feeChargeId,
        payout_request_id: request.request_id,
        recovered_automatically: true,
      },
    });
  }

  feeRows.push({
    role: request.role,
    user_id: request.user_id,
    stripe_account_id: request.stripe_account_id,
    month_key: request.month_key,
    fee_type: 'payout',
    amount_cents: 55,
    currency: request.currency.toUpperCase(),
    stripe_payout_id: payoutId,
    meta: {
      note: isFirstPayoutThisMonth
        ? 'First payout of month: payout fee'
        : 'Payout fee',
      fee_charge_id: feeChargeId,
      payout_request_id: request.request_id,
      recovered_automatically: true,
    },
  });

  for (const feeRow of feeRows) {
    const { error } = await supabaseAdmin
      .from('payout_fees_log')
      .insert(feeRow);

    if (error && error.code !== '23505') {
      throw new Error(`Payout fee log insert failed: ${error.message}`);
    }
  }
}

async function recoverRequest(request: PayoutRequest) {
  if (request.error_code === 'fee_refund_pending') {
    if (!request.stripe_fee_charge_id) {
      await updateRequest(request, {
        status: 'failed',
        error_code: 'fee_refund_missing_charge',
        next_retry_at: null,
      });
      return;
    }

    await refundCollectedFee(
      request,
      request.stripe_fee_charge_id,
      'payout_failed_fee_refunded'
    );
    return;
  }

  let feeChargeId = request.stripe_fee_charge_id;

  if (!feeChargeId) {
    try {
      const feeCharge = await stripe.charges.create(
        {
          amount: request.fee_cents,
          currency: request.currency,
          source: request.stripe_account_id,
          description:
            `click4tip payout fee (${request.month_key})`,
          metadata: {
            role: request.role,
            user_id: request.user_id,
            month_key: request.month_key,
            payout_request_id: request.request_id,
            fee_cents: String(request.fee_cents),
            recovered_automatically: 'true',
          },
        },
        {
          idempotencyKey:
            `manual_payout_fee_${request.request_id}`,
        }
      );

      feeChargeId = feeCharge.id;

      await updateRequest(request, {
        stripe_fee_charge_id: feeChargeId,
        error_code: 'payout_retry_pending',
      });
    } catch (error) {
      console.error('Automatic account debit retry failed:', error);

      if (isAmbiguousStripeError(error)) {
        await scheduleRetry(
          request,
          'fee_collection_result_unknown'
        );
      } else {
        await updateRequest(request, {
          status: 'failed',
          error_code: 'fee_collection_failed',
          next_retry_at: null,
        });
      }

      return;
    }
  }

  let payout: Stripe.Payout;

  try {
    payout = await stripe.payouts.create(
      {
        amount: request.payout_amount_cents,
        currency: request.currency,
        metadata: {
          payout_request_id: request.request_id,
          fee_charge_id: feeChargeId,
          recovered_automatically: 'true',
        },
      },
      {
        stripeAccount: request.stripe_account_id,
        idempotencyKey: `manual_payout_${request.request_id}`,
      }
    );
  } catch (error) {
    console.error('Automatic payout retry failed:', error);

    if (isAmbiguousStripeError(error)) {
      await scheduleRetry(request, 'payout_result_unknown');
      return;
    }

    await refundCollectedFee(
      request,
      feeChargeId,
      'payout_failed_fee_refunded'
    );
    return;
  }

  await logCollectedFee(request, feeChargeId, payout.id);

  await updateRequest(request, {
    status: 'succeeded',
    stripe_fee_charge_id: feeChargeId,
    stripe_payout_id: payout.id,
    error_code: null,
    next_retry_at: null,
  });
}

export async function GET(req: Request) {
  return POST(req);
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Not authorized' },
      { status: 401 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('payout_requests')
    .select(REQUEST_COLUMNS)
    .eq('status', 'processing')
    .not('next_retry_at', 'is', null)
    .lte('next_retry_at', now)
    .order('next_retry_at', { ascending: true })
    .limit(25);

  if (error) {
    console.error('Payout retry candidate lookup failed:', error);
    return NextResponse.json(
      { ok: false, error: 'candidate_lookup_failed' },
      { status: 500 }
    );
  }

  let processed = 0;
  let failed = 0;

  for (const candidate of data ?? []) {
    const request = candidate as unknown as PayoutRequest;
    const retryCount = request.retry_count + 1;
    const lockUntil = new Date(Date.now() + 2 * 60_000).toISOString();

    const { data: locked, error: lockError } = await supabaseAdmin
      .from('payout_requests')
      .update({
        retry_count: retryCount,
        next_retry_at: lockUntil,
        processing_expires_at: new Date(
          Date.now() + 30 * 60_000
        ).toISOString(),
        updated_at: now,
      })
      .eq('request_id', request.request_id)
      .eq('status', 'processing')
      .eq('retry_count', request.retry_count)
      .lte('next_retry_at', now)
      .select(REQUEST_COLUMNS)
      .maybeSingle();

    if (lockError) {
      console.error('Payout retry lock failed:', lockError);
      failed++;
      continue;
    }

    if (!locked) continue;

    try {
      await recoverRequest(locked as unknown as PayoutRequest);
      processed++;
    } catch (recoveryError) {
      console.error('Unexpected payout recovery error:', recoveryError);

      try {
        await scheduleRetry(
          locked as unknown as PayoutRequest,
          'automatic_retry_failed'
        );
      } catch (scheduleError) {
        console.error('Payout retry scheduling failed:', scheduleError);
      }

      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    failed,
  });
}
