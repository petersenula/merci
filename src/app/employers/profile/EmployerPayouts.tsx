'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { useT } from '@/lib/translation';
import { authenticatedFetch } from '@/lib/authenticatedFetch';
import type { Database } from '@/types/supabase';
import EmployerStripeAccountSetupModal from '@/components/stripe/EmployerStripeAccountSetupModal';

type EmployerProfile = Database['public']['Tables']['employers']['Row'];

type Props = {
  profile: EmployerProfile;
};

type PayoutMode = 'manual' | 'auto';
type AutoInterval = 'daily' | 'weekly' | 'monthly';

const STRIPE_MIN_PAYOUT_BY_CURRENCY: Record<string, number> = {
  CHF: 500,
  EUR: 100,
  USD: 100,
  GBP: 100,
};

const STRIPE_MIN_PAYOUT_CENTS = 500; // 5.00 CHF

const WEEK_DAYS = [
  { value: 'monday', labelKey: 'weekday_monday' },
  { value: 'tuesday', labelKey: 'weekday_tuesday' },
  { value: 'wednesday', labelKey: 'weekday_wednesday' },
  { value: 'thursday', labelKey: 'weekday_thursday' },
  { value: 'friday', labelKey: 'weekday_friday' },
  { value: 'saturday', labelKey: 'weekday_saturday' },
  { value: 'sunday', labelKey: 'weekday_sunday' },
];

export default function EmployerPayouts({ profile }: Props) {
  const { t } = useT();

  const [feePreview, setFeePreview] = useState<{
    currency: string;
    available_cents: number;
    can_payout: boolean;
    fee_cents: number;
    payout_amount_cents: number;
    isFirstPayoutThisMonth: boolean;
    breakdown?: {
      monthly_active_fee_cents: number;
      payout_fee_cents: number;
    };
  } | null>(null);

  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [payoutNowLoading, setPayoutNowLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [showStripeSetupModal, setShowStripeSetupModal] = useState(false);
  const [openingStripeAccount, setOpeningStripeAccount] = useState(false);

  const [availableBalance, setAvailableBalance] = useState<{
    amount: number;
    currency: string;
  } | null>(null);

  const [payoutMode, setPayoutMode] = useState<PayoutMode>('manual');
  const [interval, setInterval] = useState<AutoInterval>('weekly');
  const [weeklyAnchor, setWeeklyAnchor] = useState('monday');
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [minAmount, setMinAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('CHF');

  // Stripe account status
  const [accountStatus, setAccountStatus] = useState<{
    charges_enabled: boolean;
    payouts_enabled: boolean;
  } | null>(null);

  const minPayoutAmount =
    availableBalance
      ? STRIPE_MIN_PAYOUT_BY_CURRENCY[
          availableBalance.currency.toUpperCase()
        ] ?? 0
      : 0;

  const payoutAmountCents = feePreview?.payout_amount_cents ?? null;

  const isBelowMinPayout =
    payoutAmountCents != null
      ? payoutAmountCents < STRIPE_MIN_PAYOUT_CENTS
      : false;

  // --- 1. Open a Stripe account from the employer profile ---
  const handleOpenStripeAccount = async (
    businessType: 'individual' | 'company'
  ) => {
    setOpeningStripeAccount(true);
    setError(null);

    try {
      const res = await authenticatedFetch('/api/employers/stripe-recreate', {
        method: 'POST',
        body: JSON.stringify({
          lang: profile.locale,
          stripe_business_type: businessType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.onboardingUrl) {
        throw new Error(data?.error || 'Failed to create Stripe account');
      }

      window.location.href = data.onboardingUrl;
    } catch (err) {
      console.error(err);
      setError(t('stripe_recreate_error'));
      setOpeningStripeAccount(false);
    }
  };

  // --- 2. Stripe dashboard ---
  const handleStripeDashboard = async () => {
    if (!profile.stripe_account_id) return;

    const res = await authenticatedFetch(
      '/api/employers/stripe-dashboard',
      { method: 'POST' },
    );

    const data = await res.json();

    if (data?.url) {
      window.location.href = data.url;
    } else {
      console.error('Failed to get Stripe link', data);
    }
  };

  // --- 3. Load Stripe settings ---
  const loadStripeSettings = async () => {
    if (!profile.stripe_account_id) return;

    setLoadingSettings(true);
    setError(null);

    try {
      const res = await authenticatedFetch(
        '/api/employers/stripe-settings'
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load settings');

      // Balance
      setAvailableBalance(data.balance ?? null);

      // Payout settings
      if (data.payoutSettings) {
        const s = data.payoutSettings;

        setCurrency(s.currency);

        // We temporarily allow ONLY manual payouts in the app UI
        setPayoutMode('manual');
        setInterval('weekly');

        if (typeof s.min_amount === 'number') {
          setMinAmount(s.min_amount);
        } else {
          setMinAmount('');
        }
      }

      if (data.accountStatus) {
        setAccountStatus({
          charges_enabled: data.accountStatus.charges_enabled,
          payouts_enabled: data.accountStatus.payouts_enabled,
        });
        await loadPayoutFeePreview();
      }

    } catch (err) {
      console.error(err);
      setError(t('payouts_error_load'));
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadPayoutFeePreview = async () => {
    if (!profile.stripe_account_id) return;

    try {
      const res = await authenticatedFetch(
        '/api/employers/payout-fee-preview'
      );
      const data = await res.json();

      if (!res.ok) {
        console.error('Preview error:', data);
        return;
      }

      setFeePreview(data);
    } catch (err) {
      console.error('Failed to load payout fee preview:', err);
    }
  };

  useEffect(() => {
    loadStripeSettings();
  }, [profile.stripe_account_id]);

  // --- 4. Save payout settings ---
  const handleSaveSettings = async () => {
    if (!profile.stripe_account_id) return;

    setSavingSettings(true);
    setError(null);

    try {
      const body = {
        mode: payoutMode,
        interval: payoutMode === 'auto' ? interval : 'manual',
        weeklyAnchor: interval === 'weekly' ? weeklyAnchor : null,
        monthlyDay: interval === 'monthly' ? monthlyDay : null,
        minAmount: minAmount === '' ? null : Number(minAmount),
        currency,
      };

      const res = await authenticatedFetch('/api/employers/stripe-settings', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      await loadStripeSettings();
    } catch (err) {
      console.error(err);
      setError(t('payouts_error_save'));
    } finally {
      setSavingSettings(false);
    }
  };

  // --- 5. Manual payout ---
  const handlePayoutNow = async () => {
    if (isBelowMinPayout) return;

    if (!profile.stripe_account_id) return;

    setPayoutNowLoading(true);
    setError(null);

    const payoutRequestStorageKey =
      `click4tip:employer-payout-request:${profile.user_id}`;

    const requestId =
      window.sessionStorage.getItem(payoutRequestStorageKey) ??
      crypto.randomUUID();

    window.sessionStorage.setItem(payoutRequestStorageKey, requestId);

    try {
      let pollStatusOnly = false;

      for (let attempt = 0; attempt < 40; attempt++) {
        const res = pollStatusOnly
          ? await authenticatedFetch(
              `/api/employers/payout-now?requestId=${encodeURIComponent(requestId)}`
            )
          : await authenticatedFetch('/api/employers/payout-now', {
              method: 'POST',
              body: JSON.stringify({ requestId }),
            });

        const data = await res.json();

        if (res.status === 202 && data?.status === 'processing') {
          pollStatusOnly = true;

          const retryAfterMs =
            typeof data.retry_after_ms === 'number'
              ? Math.max(1000, Math.min(data.retry_after_ms, 5000))
              : 3000;

          await new Promise((resolve) =>
            window.setTimeout(resolve, retryAfterMs)
          );
          continue;
        }

        if (!res.ok) {
          if (data?.retry_with_new_request === true) {
            window.sessionStorage.removeItem(payoutRequestStorageKey);
          }

          throw new Error(data.error || 'Failed to create payout');
        }

        window.sessionStorage.removeItem(payoutRequestStorageKey);
        await loadStripeSettings();
        return;
      }

      throw new Error('Payout is still processing');
    } catch (err) {
      console.error(err);
      setError(t('payouts_error_payout_now'));
    } finally {
      setPayoutNowLoading(false);
    }
  };

  // Helpers
  const handleMinAmountChange = (value: string) => {
    if (value === '') return setMinAmount('');
    const num = Number(value.replace(',', '.'));
    if (!Number.isNaN(num)) setMinAmount(num);
  };

  const renderAutoSection = () => (
    <div className="space-y-4">
      {/* Auto interval selection */}
      <div className="space-y-2">
        <div className="font-medium">{t('payouts_auto_title')}</div>

        <div className="flex flex-wrap gap-2 mt-1">
          {[
            { value: 'daily', label: t('payouts_auto_daily') },
            { value: 'weekly', label: t('payouts_auto_weekly') },
            { value: 'monthly', label: t('payouts_auto_monthly') },
          ].map((opt) => (
          <Button
            key={opt.value}
            onClick={() => setInterval(opt.value as AutoInterval)}
            variant={interval === opt.value ? 'green' : 'outline'}
            className="px-3 py-1 rounded-lg"
          >
            {opt.label}
          </Button>

          ))}
        </div>
      </div>

      {interval === 'weekly' && (
        <div className="space-y-1">
          <div className="font-medium">
            {t('payouts_weekday_label')}
          </div>

          <div className="flex flex-wrap gap-2 mt-1">
            {WEEK_DAYS.map((day) => (
              <Button
                key={day.value}
                onClick={() => setWeeklyAnchor(day.value)}
                variant={weeklyAnchor === day.value ? 'green' : 'outline'}
                className="px-3 py-1 rounded-lg"
              >
                {t(day.labelKey)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {interval === 'monthly' && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-600">
            {t('payouts_monthday_label')}
          </div>
          <input
            type="number"
            min={1}
            max={31}
            className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
            value={monthlyDay}
            onChange={(e) => setMonthlyDay(Number(e.target.value) || 1)}
          />
        </div>
      )}

      {(interval === 'weekly' || interval === 'monthly') && (
        <div className="space-y-1">
          <div className="font-medium">
            {t('payouts_minAmount_label')}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="w-32 rounded border border-slate-300 px-2 py-1 text-sm"
              value={minAmount === '' ? '' : String(minAmount)}
              onChange={(e) => handleMinAmountChange(e.target.value)}
            />
            <span className="text-xs text-slate-500">
              {t('payouts_minAmount_hint')}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 text-sm text-slate-700">

      <div className="bg-white border rounded p-4 shadow-sm">
        <p>{t("step6_payouts")}</p>
      </div>
      {/* Stripe account ID */}
      <p>
        {t('payouts_stripeAccount')}:{' '}
        <strong>{profile.stripe_account_id ?? '—'}</strong>
      </p>

      {profile.stripe_status === 'deleted' && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-3">
          <div>
            <p className="font-medium text-orange-800">
              {t('stripe_account_deleted_title')}
            </p>
            <p className="mt-1 text-sm text-orange-700">
              {t('stripe_account_deleted_text')}
            </p>
          </div>

          <Button
            variant="green"
            onClick={() => setShowStripeSetupModal(true)}
          >
            {t('stripe_create_again')}
          </Button>
        </div>
      )}

      {profile.payment_account_mode === 'team_only' &&
        !profile.stripe_account_id &&
        profile.stripe_status !== 'deleted' && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div>
              <p className="font-medium text-slate-900">
                {t('stripe_account_not_opened_title')}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {t('stripe_account_not_opened_text')}
              </p>
            </div>

            <Button
              variant="green"
              onClick={() => setShowStripeSetupModal(true)}
            >
              {t('stripe_account_open_button')}
            </Button>
          </div>
        )}

      {profile.stripe_status !== 'deleted' && (
        <>
          {profile.stripe_account_id && (
            <div className="mt-6 space-y-4 border-t pt-4">

              {/* Balance block */}
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm">
                <div className="font-semibold text-emerald-700">
                  {t('payouts_availableForPayout')}
                </div>
                <div className="text-emerald-600">
                  {loadingSettings && !availableBalance && t('payouts_loading')}
                  {!loadingSettings && availableBalance && (
                    <>
                      {(availableBalance.amount / 100).toFixed(2)}{' '}
                      {availableBalance.currency.toUpperCase()}
                    </>
                  )}
                  {!loadingSettings && !availableBalance && <span>—</span>}
                </div>
              </div>

              {/* Fee preview */}
              {feePreview && (
                <div className="rounded-md border bg-white px-3 py-2 text-xs text-slate-700 space-y-1">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {t('payouts_fee_today') ?? 'Withdrawal fee today'}
                      </span>

                      {/* Tooltip */}
                      <details className="relative group">
                        <summary
                          className="list-none cursor-pointer select-none w-5 h-5 rounded-full border border-slate-300 text-slate-600 flex items-center justify-center text-[11px] leading-none hover:bg-slate-50"
                          aria-label="Fee info"
                          title="Info"
                        >
                          ?
                        </summary>

                        <div className="absolute z-50 mt-2 w-72 rounded-lg border bg-white p-3 shadow-lg text-xs text-slate-700 left-0">
                          {t('payouts_fee_tooltip') ??
                            'Stripe fee: The first payout of the month costs 2.55 CHF. Each additional payout in the same month costs 0.55 CHF.'}
                        </div>
                      </details>
                    </div>
                    <span>
                      {(feePreview.fee_cents / 100).toFixed(2)} {feePreview.currency}
                    </span>
                  </div>

                  {feePreview.isFirstPayoutThisMonth && (
                    <div className="text-amber-700">
                      {t('payouts_fee_first_this_month') ?? 'First payout this month includes monthly active account fee.'}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="font-medium">
                      {t('payouts_you_receive') ?? 'You will receive'}
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      {(feePreview.payout_amount_cents / 100).toFixed(2)} {feePreview.currency}
                    </span>
                  </div>
                </div>
              )}

              {/* Minimum payout warning */}
              {availableBalance &&
                availableBalance.currency === 'CHF' &&
                availableBalance.amount < 500 && (
                  <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {t('payouts_minimum_chf')}
                  </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Stripe readiness */}
              {accountStatus && (
                <div className="rounded-md border p-3 text-sm">
                  {accountStatus.payouts_enabled ? (
                    <div className="text-emerald-700 font-medium">
                      {t('payouts_ready')}
                    </div>
                  ) : (
                    <div className="text-amber-700 space-y-2">
                      <p>{t('payouts_not_ready')}</p>
                      <Button variant="green" onClick={handleStripeDashboard}>
                        {t('payouts_complete_settings')}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Small instruction 
              {accountStatus?.payouts_enabled && (
                <p className="text-xs text-slate-500">
                  {t('payouts_configure_before_save')}
                </p>
              )}
              */}
              {/* Mode selection 
              <div className="space-y-2">
                <div className="font-medium">{t('payouts_mode_title')}</div>

                <div className="flex justify-start gap-2 mt-1">
                  {[
                    { value: 'manual', label: t('payouts_mode_manual') },
                    { value: 'auto', label: t('payouts_mode_auto') },
                  ].map((item) => (
                    <Button
                      key={item.value}
                      onClick={() => setPayoutMode(item.value as PayoutMode)}
                      variant={payoutMode === item.value ? 'green' : 'outline'}
                      className="px-3 py-1 rounded-lg"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
              */}

              {/* Manual payout */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  {t('payouts_manual_help')}
                </p>

                <Button
                  variant="green"
                  onClick={handlePayoutNow}
                  disabled={
                    payoutNowLoading ||
                    loadingSettings ||
                    isBelowMinPayout ||
                    (feePreview ? !feePreview.can_payout : false)
                  }
                >
                  {payoutNowLoading
                    ? t('payouts_payoutNow_loading')
                    : feePreview?.can_payout
                      ? `${t('payouts_payoutNow') ?? 'Withdraw'} ${(feePreview.payout_amount_cents / 100).toFixed(2)} ${feePreview.currency}`
                      : t('payouts_payoutNow')}
                </Button>

                {isBelowMinPayout && (
                  <p className="text-xs text-amber-600">
                    {t('payouts_minimum_chf')}
                  </p>
                )}
              </div>

              {/* Auto payout 
              {payoutMode === 'auto' && renderAutoSection()}
              */}

              {/* Save 
              <div>
                <Button
                  variant="green"
                  onClick={handleSaveSettings}
                  disabled={savingSettings || loadingSettings}
                >
                  {savingSettings
                    ? t('payouts_saveSettings_loading')
                    : t('payouts_saveSettings')}
                </Button>
              </div>
              */}

              {/* Dashboard link */}
              <div className="pt-6 border-t mt-6">
                <p className="text-xs text-slate-500 mb-2">
                  {t('payouts_go_to_dashboard_hint')}
                </p>
                <Button variant="outline" onClick={handleStripeDashboard}>
                  {t('payouts_open_dashboard')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      <EmployerStripeAccountSetupModal
        open={showStripeSetupModal}
        loading={openingStripeAccount}
        onClose={() => {
          if (!openingStripeAccount) {
            setShowStripeSetupModal(false);
          }
        }}
        onConfirm={handleOpenStripeAccount}
      />
    </div>
  );
}
