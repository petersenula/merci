// src/app/api/earners/stripe-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authenticateApiRequest } from '@/lib/authenticateApiRequest';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'; // ← обязательно для обновления статусов

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ======================================================
// GET — возвращает баланс, настройки выплат,
//       выбранную валюту,
//       статус счета (charges_enabled / payouts_enabled)
//       и ОБНОВЛЯЕТ эти статусы в Supabase
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: earner, error: earnerError } = await supabaseAdmin
      .from('profiles_earner')
      .select('id, stripe_account_id, stripe_status')
      .eq('id', user.id)
      .maybeSingle();

    if (earnerError) {
      console.error('Earner lookup error:', earnerError);
      return NextResponse.json(
        { error: 'Failed to load earner profile' },
        { status: 500 },
      );
    }

    if (!earner) {
      return NextResponse.json(
        { error: 'Earner profile not found' },
        { status: 404 },
      );
    }

    if (!earner.stripe_account_id) {
      return NextResponse.json(
        { error: 'Missing Stripe account' },
        { status: 400 },
      );
    }

    if (earner.stripe_status === 'deleted') {
      return NextResponse.json(
        { error: 'Stripe account deleted' },
        { status: 400 },
      );
    }

    const accountId = earner.stripe_account_id;

    const [balance, account] = await Promise.all([
      stripe.balance.retrieve({ stripeAccount: accountId }),
      stripe.accounts.retrieve(accountId),
    ]);

    const mainAvailable = balance.available[0] ?? null;

    const schedule: any =
      ((account as any).settings?.payouts?.schedule as any) ?? {};

    const minAmountCentsStr =
      ((account as any).metadata?.payouts_min_amount_eur as string) ?? null;

    const minAmount =
      minAmountCentsStr != null ? Number(minAmountCentsStr) / 100 : null;

    const payoutCurrency =
      ((account as any).metadata?.payouts_currency as string) ??
      mainAvailable?.currency ??
      'CHF';

    const chargesEnabled = account.charges_enabled;
    const payoutsEnabled = account.payouts_enabled;

    await supabaseAdmin
      .from('profiles_earner')
      .update({
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: payoutsEnabled,
      })
      .eq('id', user.id);

    return NextResponse.json({
      balance: mainAvailable
        ? {
            amount: mainAvailable.amount,
            currency: mainAvailable.currency,
          }
        : null,
      payoutSettings: {
        interval: schedule.interval ?? 'manual',
        weekly_anchor: schedule.weekly_anchor ?? 'monday',
        monthly_anchor: schedule.monthly_anchor ?? 1,
        min_amount: minAmount,
        currency: payoutCurrency,
      },
      accountStatus: {
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
      },
    });
  } catch (e) {
    console.error('GET /earners/stripe-settings error:', e);
    return NextResponse.json(
      { error: 'Failed to load Stripe settings' },
      { status: 500 },
    );
  }
}

// ======================================================
// POST — обновляет настройки Stripe (schedule, minAmount, currency)
//         возвращает обновленные настройки
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    const {
      mode,
      interval,
      weeklyAnchor,
      monthlyDay,
      minAmount,
      currency,
    } = await req.json();

    const supabaseAdmin = getSupabaseAdmin();

    const { data: earner, error: earnerError } = await supabaseAdmin
      .from('profiles_earner')
      .select('id, stripe_account_id, stripe_status')
      .eq('id', user.id)
      .maybeSingle();

    if (earnerError) {
      console.error('Earner lookup error:', earnerError);
      return NextResponse.json(
        { error: 'Failed to load earner profile' },
        { status: 500 },
      );
    }

    if (!earner) {
      return NextResponse.json(
        { error: 'Earner profile not found' },
        { status: 404 },
      );
    }

    if (!earner.stripe_account_id) {
      return NextResponse.json(
        { error: 'Missing Stripe account' },
        { status: 400 },
      );
    }

    if (earner.stripe_status === 'deleted') {
      return NextResponse.json(
        { error: 'Stripe account deleted' },
        { status: 400 },
      );
    }

    const accountId = earner.stripe_account_id;

    // 1. Формируем расписание для Stripe
    const realInterval = 'manual';

    const scheduleUpdate: any = {
      interval: realInterval,
    };

    // 2. Metadata — минимальный порог + выбранная валюта
    const metadataUpdate: Record<string, string> = {};

    if (typeof minAmount === 'number' && !Number.isNaN(minAmount)) {
      metadataUpdate.payouts_min_amount_eur = String(
        Math.round(minAmount * 100),
      );
    }

    if (currency) {
      metadataUpdate.payouts_currency = currency;
    }

    const updateParams: Stripe.AccountUpdateParams = {
      settings: {
        payouts: {
          schedule: scheduleUpdate,
        },
      },
    };

    if (Object.keys(metadataUpdate).length > 0) {
      (updateParams as any).metadata = metadataUpdate;
    }

    // --- обновляем Stripe ---
    const account = await stripe.accounts.update(accountId, updateParams);

    // читаем обратно
    const schedule: any =
      ((account as any).settings?.payouts?.schedule as any) ?? {};

    const minAmountCentsStr =
      ((account as any).metadata?.payouts_min_amount_eur as string) ?? null;

    const minAmountResult =
      minAmountCentsStr != null ? Number(minAmountCentsStr) / 100 : null;

    const payoutCurrency =
      ((account as any).metadata?.payouts_currency as string) ?? 'CHF';

    return NextResponse.json({
      payoutSettings: {
        interval: schedule.interval ?? 'manual',
        weekly_anchor: schedule.weekly_anchor ?? 'monday',
        monthly_anchor: schedule.monthly_anchor ?? 1,
        min_amount: minAmountResult,
        currency: payoutCurrency,
      },
    });
  } catch (e) {
    console.error('POST /earners/stripe-settings error:', e);
    return NextResponse.json(
      { error: 'Failed to save Stripe settings' },
      { status: 500 },
    );
  }
}
