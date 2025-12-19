// src/app/api/earners/payout-now/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST /api/earners/payout-now
// body: { accountId }
// Логика:
//   1. читаем баланс и metadata (минимальный порог)
//   2. если доступно меньше порога → ошибка
//   3. если больше → отправляем ВЕСЬ доступный баланс payout'ом
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId' },
        { status: 400 },
      );
    }

    // 1. читаем баланс и аккаунт
    const [balance, account] = await Promise.all([
      stripe.balance.retrieve({ stripeAccount: accountId }),
      stripe.accounts.retrieve(accountId),
    ]);

    const mainAvailable = balance.available[0];

    if (!mainAvailable || mainAvailable.amount <= 0) {
      return NextResponse.json(
        { error: 'No available balance for payout' },
        { status: 400 },
      );
    }

    // 2. читаем наш порог из metadata
    const minAmountCentsStr =
      ((account as any).metadata?.payouts_min_amount_eur as string) ?? null;

      // читаем выбранную валюту
    const payoutCurrency =
      ((account as any).metadata?.payouts_currency as string) ?? mainAvailable.currency;

    const minAmountCents = minAmountCentsStr
      ? parseInt(minAmountCentsStr, 10)
      : 0;

    if (mainAvailable.amount <= minAmountCents) {
      return NextResponse.json(
        { error: 'Balance is below your minimum payout amount' },
        { status: 400 },
      );
    }

    // 3. создаём payout на ВЕСЬ доступный баланс
    const payout = await stripe.payouts.create(
      {
        amount: mainAvailable.amount,
        currency: payoutCurrency,
      },
      { stripeAccount: accountId },
    );
    

    return NextResponse.json({
      payoutId: payout.id,
      status: payout.status,
    });
  } catch (e) {
    console.error('POST /earners/payout-now error:', e);
    return NextResponse.json(
      { error: 'Failed to create payout' },
      { status: 500 },
    );
  }
}
