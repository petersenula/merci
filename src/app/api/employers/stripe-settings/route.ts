// src/app/api/employers/stripe-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ============================
// GET — читаем баланс + настройки + статус Stripe
// ============================
export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId' },
        { status: 400 }
      );
    }

    // 1. Баланс + аккаунт
    let balance;
    let account;

    try {
    [balance, account] = await Promise.all([
        stripe.balance.retrieve({ stripeAccount: accountId }),
        stripe.accounts.retrieve(accountId),
    ]);
    } catch (err: any) {
    // ⛔ Stripe account удалён или доступ отозван
    if (err?.code === 'account_invalid') {
        await supabaseAdmin
        .from('employers')
        .update({
            stripe_account_id: null,
            stripe_charges_enabled: false,
            stripe_payouts_enabled: false,
            stripe_status: 'deleted',
        })
        .eq('stripe_account_id', accountId);

        return NextResponse.json(
        {
            accountStatus: {
            deleted: true,
            },
        },
        { status: 200 }
        );
    }

    throw err;
    }

    const mainAvailable = balance.available[0] ?? null;

    // настройки расписания
    const schedule: any =
      ((account as any).settings?.payouts?.schedule as any) ?? {};

    // минимальный порог
    const minAmountCentsStr =
      ((account as any).metadata?.payouts_min_amount_eur as string) ?? null;

    const minAmount =
      minAmountCentsStr != null ? Number(minAmountCentsStr) / 100 : null;

    // валюта
    const payoutCurrency =
      ((account as any).metadata?.payouts_currency as string) ??
      mainAvailable?.currency ??
      'CHF';

    // флаги Stripe
    const chargesEnabled = account.charges_enabled;
    const payoutsEnabled = account.payouts_enabled;

    // обновляем в таблице employers
    await supabaseAdmin
      .from('employers')
      .update({
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: payoutsEnabled,
      })
      .eq('stripe_account_id', accountId);

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
    console.error('GET /employers/stripe-settings error:', e);
    return NextResponse.json(
      { error: 'Failed to load Stripe settings' },
      { status: 500 }
    );
  }
}

// ============================
// POST — сохраняем настройки Stripe
// ============================
export async function POST(req: NextRequest) {
  try {
    const {
      accountId,
      mode,
      interval,
      weeklyAnchor,
      monthlyDay,
      minAmount,
      currency,
    } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId' },
        { status: 400 }
      );
    }

    const realInterval = mode === 'manual' ? 'manual' : interval;

    const scheduleUpdate: any = {
      interval: realInterval,
    };

    if (realInterval === 'weekly') {
      scheduleUpdate.weekly_anchor = weeklyAnchor || 'monday';
    }

    if (realInterval === 'monthly') {
      scheduleUpdate.monthly_anchor = monthlyDay || 1;
    }

    const metadataUpdate: Record<string, string> = {};

    if (typeof minAmount === 'number' && !Number.isNaN(minAmount)) {
      metadataUpdate.payouts_min_amount_eur = String(
        Math.round(minAmount * 100)
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

    const account = await stripe.accounts.update(accountId, updateParams);

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
    console.error('POST /employers/stripe-settings error:', e);
    return NextResponse.json(
      { error: 'Failed to save Stripe settings' },
      { status: 500 }
    );
  }
}
