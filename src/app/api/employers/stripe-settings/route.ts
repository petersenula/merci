// src/app/api/employers/stripe-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authenticateApiRequest } from '@/lib/authenticateApiRequest';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ============================
// GET — читаем баланс + настройки + статус Stripe
// ============================
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: employer, error: employerError } = await supabaseAdmin
      .from('employers')
      .select('user_id, stripe_account_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (employerError) {
      console.error('Employer lookup error:', employerError);
      return NextResponse.json(
        { error: 'Failed to load employer' },
        { status: 500 }
      );
    }

    if (!employer) {
      return NextResponse.json(
        { error: 'Employer not found' },
        { status: 404 }
      );
    }

    if (!employer.stripe_account_id) {
      return NextResponse.json(
        { error: 'Stripe not connected' },
        { status: 400 }
      );
    }

    const accountId = employer.stripe_account_id;

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
            stripe_onboarding_complete: false,
            stripe_status: 'deleted',
            payment_account_mode: 'team_only',
        })
        .eq('user_id', user.id);

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
      .eq('user_id', user.id);

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
    const user = await authenticateApiRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
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

    const { data: employer, error: employerError } = await supabaseAdmin
      .from('employers')
      .select('stripe_account_id, stripe_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (employerError) {
      console.error('Employer lookup error:', employerError);
      return NextResponse.json(
        { error: 'Failed to load employer' },
        { status: 500 }
      );
    }

    if (!employer) {
      return NextResponse.json(
        { error: 'Employer not found' },
        { status: 404 }
      );
    }

    if (!employer.stripe_account_id) {
      return NextResponse.json(
        { error: 'Stripe not connected' },
        { status: 400 }
      );
    }

    if (employer.stripe_status === 'deleted') {
      return NextResponse.json(
        { error: 'Stripe account deleted' },
        { status: 400 }
      );
    }

    const accountId = employer.stripe_account_id;
    const realInterval = 'manual';

    const scheduleUpdate: any = {
      interval: realInterval,
    };

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
