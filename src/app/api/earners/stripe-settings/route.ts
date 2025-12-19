// src/app/api/earners/stripe-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
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
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const supabaseAdmin = getSupabaseAdmin();

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId' },
        { status: 400 },
      );
    }

    // 1. Баланс и аккаунт параллельно
    const [balance, account] = await Promise.all([
      stripe.balance.retrieve({ stripeAccount: accountId }),
      stripe.accounts.retrieve(accountId),
    ]);

    const mainAvailable = balance.available[0] ?? null;

    const schedule: any =
      ((account as any).settings?.payouts?.schedule as any) ?? {};

    // Минимальный порог (наша metadata)
    const minAmountCentsStr =
      ((account as any).metadata?.payouts_min_amount_eur as string) ?? null;

    const minAmount =
      minAmountCentsStr != null ? Number(minAmountCentsStr) / 100 : null;

    // Валюта выплат
    const payoutCurrency =
      ((account as any).metadata?.payouts_currency as string) ??
      mainAvailable?.currency ??
      'CHF';

    // --- ДВА НОВЫХ СТАТУСА, которые мы сохраняем в таблицу ---
    const chargesEnabled = account.charges_enabled;
    const payoutsEnabled = account.payouts_enabled;

    // --- обновляем в Supabase ---
    await supabaseAdmin
      .from('profiles_earner')
      .update({
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: payoutsEnabled,
      })
      .eq('stripe_account_id', accountId);

    // --- возвращаем клиенту ---
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
        { status: 400 },
      );
    }

    // 1. Формируем расписание для Stripe
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
