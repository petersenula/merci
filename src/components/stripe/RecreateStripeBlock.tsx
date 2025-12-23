'use client';

import Button from '@/components/ui/button';
import { useT } from '@/lib/translation';

type Props = {
  stripeStatus: string | null;
  userId: string;
  role: 'employer' | 'earner';
  onStart?: () => void; // ✅ НОВОЕ
};

export default function RecreateStripeBlock({
  stripeStatus,
  userId,
  role,
  onStart,
}: Props) {
  const { t, lang } = useT();

  if (stripeStatus !== 'deleted') return null;

  const handleRecreateStripe = async () => {
    try {
      onStart?.(); // ✅ ВКЛЮЧАЕМ LOADER В РОДИТЕЛЕ

      const res = await fetch(`/api/${role}s/stripe-recreate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, lang }),
      });

      const data = await res.json();

      if (res.ok && data?.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else {
        alert(t('stripe_recreate_error'));
      }
    } catch (e) {
      alert(t('stripe_recreate_error'));
    }
  };

  return (
    <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-2">
      <p className="text-sm text-orange-800 font-medium">
        {t('stripe_account_deleted_title')}
      </p>
      <p className="text-sm text-orange-700">
        {t('stripe_account_deleted_text')}
      </p>

      <Button variant="green" onClick={handleRecreateStripe}>
        {t('stripe_create_again')}
      </Button>
    </div>
  );
}
