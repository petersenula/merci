'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { supabaseClient } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

export function TipPaymentFlow({
  schemeId,
  amount,
  rating,
  reviewText,
  onSuccess,
}: {
  schemeId: string;
  amount: number;
  rating: number;
  reviewText: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [isPaying, setIsPaying] = useState(false);
  const [tipId, setTipId] = useState<string | null>(null);

  const handleInitPayment = async () => {
    setIsPaying(true);

    const res = await fetch('/api/tips/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schemeId,
        amount,
      }),
    });

    const data = await res.json();

    if (!data?.clientSecret || !data?.tipId) {
      console.error('PaymentIntent create failed:', data);
      setIsPaying(false);
      return;
    }

    setTipId(data.tipId);
  };

  const handleConfirm = async () => {
    if (!stripe || !elements) return;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      console.error(error);
      setIsPaying(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded' && tipId) {
      await supabaseClient
        .from('tips')
        .update({
          review_rating: rating || null,
          review_text: reviewText || null,
        })
        .eq('id', tipId);

      onSuccess();
    }

    setIsPaying(false);
  };

  return (
    <div className="space-y-4">
      {!tipId && (
        <button
          onClick={handleInitPayment}
          disabled={isPaying || amount <= 0}
          className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {isPaying ? 'Loading…' : 'Continue to payment'}
        </button>
      )}

      {tipId && (
        <>
          <PaymentElement />

          <button
            onClick={handleConfirm}
            disabled={isPaying}
            className="w-full rounded-xl bg-green-600 text-white py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {isPaying ? 'Processing…' : 'Pay now'}
          </button>
        </>
      )}
    </div>
  );
}
