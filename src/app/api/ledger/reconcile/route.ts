import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Stripe SDK — ТОЛЬКО ЗДЕСЬ (Node.js)
 * Edge Functions Stripe НЕ ВИДЯТ
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/ledger/reconcile
 *
 * body:
 * {
 *   type: "platform" | "earner",
 *   stripeAccountId?: string
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, stripeAccountId } = body ?? {};

    // ------------------------------
    // VALIDATION
    // ------------------------------
    if (!type || !["platform", "earner"].includes(type)) {
      return NextResponse.json(
        { ok: false, error: "invalid_type" },
        { status: 400 }
      );
    }

    if (type === "earner" && !stripeAccountId) {
      return NextResponse.json(
        { ok: false, error: "missing_stripe_account_id" },
        { status: 400 }
      );
    }

    // ------------------------------
    // STRIPE CALL
    // ------------------------------
    let balance: Stripe.Balance;

    if (type === "platform") {
      balance = await stripe.balance.retrieve();
    } else {
      balance = await stripe.balance.retrieve(
        {},
        { stripeAccount: stripeAccountId }
      );
    }

    const balanceCents =
      (balance.available?.[0]?.amount ?? 0) +
      (balance.pending?.[0]?.amount ?? 0);

    // ------------------------------
    // OK
    // ------------------------------
    return NextResponse.json({
      ok: true,
      balance_cents: balanceCents,
    });

  } catch (err: any) {
    /**
     * ВАЖНО:
     * Здесь мы НИКОГДА не кидаем ошибку дальше,
     * а всегда возвращаем JSON
     */
    console.error("STRIPE RECONCILE ERROR", {
      code: err?.code,
      message: err?.message,
      type: err?.type,
    });

    return NextResponse.json(
      {
        ok: false,
        error: err?.code ?? "stripe_error",
        message: err?.message,
      },
      { status: 200 } // ⚠️ намеренно 200 — Edge сам решает, что делать
    );
  }
}
