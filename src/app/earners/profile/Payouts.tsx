'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/button';
import { useT } from '@/lib/translation';
import type { Database } from '@/types/supabase';

type EarnerProfile = Database['public']['Tables']['profiles_earner']['Row'];

type Props = {
  profile: EarnerProfile;
};

type PayoutMode = 'manual' | 'auto';
type AutoInterval = 'daily' | 'weekly' | 'monthly';

const WEEK_DAYS = [
  { value: 'monday', labelKey: 'weekday_monday' },
  { value: 'tuesday', labelKey: 'weekday_tuesday' },
  { value: 'wednesday', labelKey: 'weekday_wednesday' },
  { value: 'thursday', labelKey: 'weekday_thursday' },
  { value: 'friday', labelKey: 'weekday_friday' },
  { value: 'saturday', labelKey: 'weekday_saturday' },
  { value: 'sunday', labelKey: 'weekday_sunday' },
];

export default function Payouts({ profile }: Props) {
  const { t } = useT();

  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [payoutNowLoading, setPayoutNowLoading] = useState(false);
  const STRIPE_MIN_PAYOUT_BY_CURRENCY: Record<string, number> = {
    CHF: 500,
  };
  const [error, setError] = useState<string | null>(null);

  const [availableBalance, setAvailableBalance] = useState<{
    amount: number;
    currency: string;
  } | null>(null);

  const minPayoutAmount =
  availableBalance
    ? STRIPE_MIN_PAYOUT_BY_CURRENCY[
        availableBalance.currency.toUpperCase()
      ] ?? 0
    : 0;

  const [payoutMode, setPayoutMode] = useState<PayoutMode>('manual');
  const [interval, setInterval] = useState<AutoInterval>('weekly');
  const [weeklyAnchor, setWeeklyAnchor] = useState('monday');
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [minAmount, setMinAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('CHF');

  // 🟢 Новый стейт — статус аккаунта Stripe
  const [accountStatus, setAccountStatus] = useState<{
    charges_enabled: boolean;
    payouts_enabled: boolean;
  } | null>(null);

  // --- 1. Start / Continue onboarding ---
  const handleStartOnboarding = async () => {
    const res = await fetch('/api/earners/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: profile.id,
        name: profile.display_name,
      }),
    });

    const data = await res.json();
    if (data.onboardingUrl) {
      window.location.href = data.onboardingUrl;
    }
  };

  // --- 2. Open Stripe Dashboard ---
  const handleStripeDashboard = async () => {
    if (!profile.stripe_account_id) return;

    const res = await fetch('/api/earners/stripe-dashboard', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: profile.stripe_account_id,
        chargesEnabled: profile.stripe_charges_enabled === true,
      }),
    });

    const data = await res.json();
    if (data?.url) {
      window.location.href = data.url;
    }
  };
  // --- 3. Load Stripe settings + account status ---
  const loadStripeSettings = async () => {
    if (!profile.stripe_account_id) return;

    setLoadingSettings(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/earners/stripe-settings?accountId=${profile.stripe_account_id}`,
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load settings');

      // Balance
      setAvailableBalance(data.balance ?? null);

      // Payout settings
      if (data.payoutSettings) {
        const s = data.payoutSettings;

        setCurrency(s.currency);

        if (s.interval === 'manual') {
          setPayoutMode('manual');
          setInterval('weekly');
        } else {
          setPayoutMode('auto');
          if (['daily', 'weekly', 'monthly'].includes(s.interval)) {
            setInterval(s.interval);
          }
          if (s.weekly_anchor) setWeeklyAnchor(s.weekly_anchor);
          if (s.monthly_anchor) setMonthlyDay(s.monthly_anchor);
        }

        if (typeof s.min_amount === 'number') {
          setMinAmount(s.min_amount);
        } else {
          setMinAmount('');
        }
      }

      // NEW: accountStatus
      if (data.accountStatus) {
        setAccountStatus({
          charges_enabled: data.accountStatus.charges_enabled,
          payouts_enabled: data.accountStatus.payouts_enabled,
        });
      }

    } catch (err) {
      console.error(err);
      setError(t('payouts_error_load'));
    } finally {
      setLoadingSettings(false);
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
        accountId: profile.stripe_account_id,
        mode: payoutMode,
        interval: payoutMode === 'auto' ? interval : 'manual',
        weeklyAnchor: interval === 'weekly' ? weeklyAnchor : null,
        monthlyDay: interval === 'monthly' ? monthlyDay : null,
        minAmount: minAmount === '' ? null : Number(minAmount),
        currency,
      };

      const res = await fetch('/api/earners/stripe-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
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

    try {
      const res = await fetch('/api/earners/payout-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: profile.stripe_account_id,
          currency,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create payout');

      await loadStripeSettings();
    } catch (err) {
      console.error(err);
      setError(t('payouts_error_payout_now'));
    } finally {
      setPayoutNowLoading(false);
    }
  };

  // ---------------------
  // Helpers
  // ---------------------
  const handleMinAmountChange = (value: string) => {
    if (value === '') return setMinAmount('');
    const num = Number(value.replace(',', '.'));
    if (!Number.isNaN(num)) setMinAmount(num);
  };

  const renderAutoSection = () => (
    <div className="space-y-4">
      {/* Auto schedule buttons */}
      <div className="space-y-2">
        <div className="font-medium">{t('payouts_auto_title')}</div>

        <div className="flex flex-wrap gap-2 mt-1">
          {[
            { value: 'daily', label: t('payouts_auto_daily') },
            { value: 'weekly', label: t('payouts_auto_weekly') },
            { value: 'monthly', label: t('payouts_auto_monthly') },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setInterval(opt.value as AutoInterval)}
              className={
                interval === opt.value
                  ? "px-3 py-1 rounded-lg border bg-green-600 text-white border-green-600"
                  : "px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {interval === 'weekly' && (
        <div className="space-y-1">
          {/* Weekly anchor buttons */}
          {interval === 'weekly' && (
            <div className="space-y-1">
              <div className="font-medium">
                {t('payouts_weekday_label')}
              </div>

              <div className="flex flex-wrap gap-2 mt-1">
                {WEEK_DAYS.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => setWeeklyAnchor(day.value)}
                    className={
                      weeklyAnchor === day.value
                        ? "px-3 py-1 rounded-lg border bg-green-600 text-white border-green-600"
                        : "px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                    }
                  >
                    {t(day.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          )}
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

  const isBelowMinPayout =
    availableBalance
      ? availableBalance.amount < minPayoutAmount
      : false;

  // ---------------------
  // RENDER
  // ---------------------
  return (
    <div className="space-y-4 text-sm text-slate-700">
      {/* Stripe account ID */}
      <p>
        {t('payouts_stripeAccount')}:{" "}
        <strong>{profile.stripe_account_id ?? '—'}</strong>
      </p>

      {/* AFTER ONBOARDING OR ALWAYS SHOW DASHBOARD LINK LOWER */}
      {/* --------------------- */}

      {profile.stripe_account_id && (
        <div className="mt-6 space-y-4 border-t pt-4">
          
          {/* Available balance */}
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

          {/* Error */}
          {error && (
            <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* NEW BLOCK: account readiness */}
          {accountStatus && (
            <div className="rounded-md border p-3 text-sm">
              {accountStatus.payouts_enabled ? (
                <div className="text-emerald-700 font-medium">
                  {t('payouts_ready')}
                </div>
              ) : (
                <div className="text-amber-700 space-y-2">
                  <p>{t('payouts_not_ready')}</p>
                  <Button
                    variant="orange"
                    onClick={handleStripeDashboard}
                  >
                    {t('payouts_complete_settings')}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Small instruction before changing settings */}
            {accountStatus?.payouts_enabled && (
              <p className="text-m text-slate-500">
                {t('payouts_configure_before_save' )}
              </p>
            )}
          {/* Payout mode buttons */}
          <div className="space-y-2">
            <div className="font-medium">{t('payouts_mode_title')}</div>

            <div className="flex justify-start gap-2 mt-1">
              {[
                { value: 'manual', label: t('payouts_mode_manual') },
                { value: 'auto', label: t('payouts_mode_auto') },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setPayoutMode(item.value as PayoutMode)}
                  className={
                    payoutMode === item.value
                      ? "px-3 py-1 rounded-lg border bg-green-600 text-white border-green-600"
                      : "px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual payout block */}
          {payoutMode === 'manual' && (
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
                  isBelowMinPayout
                }
              >
                {payoutNowLoading
                  ? t('payouts_payoutNow_loading')
                  : t('payouts_payoutNow')}
              </Button>

              {isBelowMinPayout && (
                <p className="text-xs text-amber-600">
                  {t('payouts_minimum_chf')}
                </p>
              )}
            </div>
          )}

          {/* Auto payout block */}
          {payoutMode === 'auto' && renderAutoSection()}

          {/* Save button */}
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

          {/* Dashboard link (BOTTOM) */}
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
    </div>
  );
}
