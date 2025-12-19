import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs'; // Stripe работает только в Node

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is not set' },
        { status: 500 }
      );
    }

    if (!appUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_APP_URL is not set' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = getSupabaseAdmin();

    const body = await req.json();

    const {
      earnerId,
      employerId,
      amountCents,
      currency = 'CHF',
      slug,
      rating,
      source = 'qr',
    } = body ?? {};

    if (!earnerId || !slug) {
      return NextResponse.json(
        { error: 'Missing earnerId or slug' },
        { status: 400 }
      );
    }

    const amount = Number(amountCents);
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amountCents' },
        { status: 400 }
      );
    }

    // --- ищем схему распределения (если есть employerId)
    let schemeId: string | null = null;

    if (employerId) {
      const { data: scheme, error } = await supabase
        .from('allocation_schemes')
        .select('id')
        .eq('employer_id', employerId)
        .eq('is_default', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string }>();

      if (error) {
        console.error('Ошибка поиска схемы распределения:', error);
      } else if (scheme) {
        schemeId = scheme.id;
      }
    }

    // --- создаём Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name: 'Tip' },
            unit_amount: amount, // в центах
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/t/${slug}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/t/${slug}?status=cancelled`,
      metadata: {
        earner_id: earnerId,
        employer_id: employerId ?? '',
        scheme_id: schemeId ?? '',
        source,
        slug,
        rating: rating ? String(rating) : '',
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Ошибка в /api/checkout:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
