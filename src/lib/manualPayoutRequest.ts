import type { SupabaseClient } from '@supabase/supabase-js';

export type ManualPayoutRole = 'earner' | 'employer';

export type ManualPayoutRequestRow = {
  request_id: string;
  role: ManualPayoutRole;
  user_id: string;
  stripe_account_id: string;
  status: 'processing' | 'succeeded' | 'failed';
  month_key: string;
  currency: string | null;
  fee_cents: number | null;
  payout_amount_cents: number | null;
  stripe_fee_charge_id: string | null;
  stripe_fee_refund_id: string | null;
  stripe_payout_id: string | null;
  error_code: string | null;
  retry_count: number;
  next_retry_at: string | null;
};

type ClaimInput = {
  supabaseAdmin: SupabaseClient;
  requestId: string;
  role: ManualPayoutRole;
  userId: string;
  stripeAccountId: string;
  monthKey: string;
  currency: string;
  feeCents: number;
  payoutAmountCents: number;
};

export type ManualPayoutClaimResult =
  | {
      ok: true;
      request: ManualPayoutRequestRow;
    }
  | {
      ok: false;
      reason: 'already_succeeded' | 'already_processing' | 'already_failed';
      request: ManualPayoutRequestRow;
    }
  | {
      ok: false;
      reason: 'concurrent_request' | 'database_error';
      request?: undefined;
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

export async function getManualPayoutRequest(
  supabaseAdmin: SupabaseClient,
  requestId: string,
  role: ManualPayoutRole,
  userId: string
): Promise<ManualPayoutRequestRow | null> {
  const { data, error } = await supabaseAdmin
    .from('payout_requests')
    .select(REQUEST_COLUMNS)
    .eq('request_id', requestId)
    .eq('role', role)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Payout request lookup failed: ${error.message}`);
  }

  return data as unknown as ManualPayoutRequestRow | null;
}

export async function hasCollectedMonthlyPayoutFee(
  supabaseAdmin: SupabaseClient,
  role: ManualPayoutRole,
  userId: string,
  monthKey: string
): Promise<boolean> {
  const { data: feeRows, error: feeLookupError } = await supabaseAdmin
    .from('payout_fees_log')
    .select('meta')
    .eq('role', role)
    .eq('user_id', userId)
    .eq('month_key', monthKey)
    .eq('fee_type', 'monthly_active');

  if (feeLookupError) {
    throw new Error(
      `Monthly payout fee lookup failed: ${feeLookupError.message}`
    );
  }

  const collectedFeeLogExists = (feeRows ?? []).some((row) => {
    const meta =
      row.meta && typeof row.meta === 'object'
        ? (row.meta as Record<string, unknown>)
        : null;

    return Boolean(meta?.fee_charge_id || meta?.fee_transfer_id);
  });

  if (collectedFeeLogExists) {
    return true;
  }

  const { data: succeededRequests, error: requestLookupError } =
    await supabaseAdmin
      .from('payout_requests')
      .select('request_id')
      .eq('role', role)
      .eq('user_id', userId)
      .eq('month_key', monthKey)
      .eq('status', 'succeeded')
      .eq('fee_cents', 255)
      .not('stripe_fee_charge_id', 'is', null)
      .limit(1);

  if (requestLookupError) {
    throw new Error(
      `Successful payout request lookup failed: ${requestLookupError.message}`
    );
  }

  return Boolean(succeededRequests?.length);
}

export async function claimManualPayoutRequest(
  input: ClaimInput
): Promise<ManualPayoutClaimResult> {
  const now = new Date().toISOString();

  const { error: staleError } = await input.supabaseAdmin
    .from('payout_requests')
    .update({
      status: 'failed',
      error_code: 'processing_timeout',
      updated_at: now,
    })
    .eq('role', input.role)
    .eq('user_id', input.userId)
    .eq('status', 'processing')
    .lt('processing_expires_at', now);

  if (staleError) {
    console.error('Stale payout request cleanup failed:', staleError);
    return { ok: false, reason: 'database_error' };
  }

  const { data: existing, error: existingError } = await input.supabaseAdmin
    .from('payout_requests')
    .select(REQUEST_COLUMNS)
    .eq('request_id', input.requestId)
    .eq('role', input.role)
    .eq('user_id', input.userId)
    .maybeSingle();

  if (existingError) {
    console.error('Existing payout request lookup failed:', existingError);
    return { ok: false, reason: 'database_error' };
  }

  if (existing) {
    const request = existing as unknown as ManualPayoutRequestRow;

    if (request.status === 'succeeded') {
      return { ok: false, reason: 'already_succeeded', request };
    }

    if (request.status === 'processing') {
      return { ok: false, reason: 'already_processing', request };
    }

    return { ok: false, reason: 'already_failed', request };
  }

  const { data: inserted, error: insertError } = await input.supabaseAdmin
    .from('payout_requests')
    .insert({
      request_id: input.requestId,
      role: input.role,
      user_id: input.userId,
      stripe_account_id: input.stripeAccountId,
      status: 'processing',
      month_key: input.monthKey,
      currency: input.currency,
      fee_cents: input.feeCents,
      payout_amount_cents: input.payoutAmountCents,
      retry_count: 0,
      next_retry_at: null,
      processing_expires_at: new Date(
        Date.now() + 10 * 60 * 1000
      ).toISOString(),
      updated_at: now,
    })
    .select(REQUEST_COLUMNS)
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return { ok: false, reason: 'concurrent_request' };
    }

    console.error('Payout request insert failed:', insertError);
    return { ok: false, reason: 'database_error' };
  }

  return {
    ok: true,
    request: inserted as unknown as ManualPayoutRequestRow,
  };
}

export async function updateManualPayoutRequest(
  supabaseAdmin: SupabaseClient,
  requestId: string,
  role: ManualPayoutRole,
  userId: string,
  values: Partial<{
    status: 'processing' | 'succeeded' | 'failed';
    stripe_fee_charge_id: string | null;
    stripe_fee_refund_id: string | null;
    stripe_payout_id: string | null;
    error_code: string | null;
    retry_count: number;
    next_retry_at: string | null;
    processing_expires_at: string;
  }>
) {
  const { error } = await supabaseAdmin
    .from('payout_requests')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
    .eq('role', role)
    .eq('user_id', userId);

  if (error) {
    console.error('Payout request update failed:', error);
  }

  return error;
}
