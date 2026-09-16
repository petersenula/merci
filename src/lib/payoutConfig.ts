import type { CurrencyCode } from '@/lib/marketConfig';

export type PayoutCurrencyConfig = {
  stripeMinPayoutMinor: number;
  appMinPayoutMinor: number;
  monthlyActiveFeeMinor: number;
  payoutFixedFeeMinor: number;

  /**
   * Stripe also charges a percentage-based payout fee.
   * Stored here for pricing completeness, but intentionally not
   * passed on to users yet.
   */
  payoutPercentRate: number;
};

export const payoutConfig: Record<CurrencyCode, PayoutCurrencyConfig> = {
  CHF: {
    stripeMinPayoutMinor: 500,
    appMinPayoutMinor: 500,
    monthlyActiveFeeMinor: 200,
    payoutFixedFeeMinor: 55,
    payoutPercentRate: 0.0025,
  },
  EUR: {
    stripeMinPayoutMinor: 100,
    appMinPayoutMinor: 100,
    monthlyActiveFeeMinor: 200,
    payoutFixedFeeMinor: 10,
    payoutPercentRate: 0.0025,
  },
  RON: {
    stripeMinPayoutMinor: 500,
    appMinPayoutMinor: 500,
    monthlyActiveFeeMinor: 1000,
    payoutFixedFeeMinor: 150,
    payoutPercentRate: 0.0025,
  },
  HUF: {
    stripeMinPayoutMinor: 36000,
    appMinPayoutMinor: 36000,
    monthlyActiveFeeMinor: 60000,
    payoutFixedFeeMinor: 10000,
    payoutPercentRate: 0.0025,
  },
  PLN: {
    stripeMinPayoutMinor: 500,
    appMinPayoutMinor: 500,
    monthlyActiveFeeMinor: 900,
    payoutFixedFeeMinor: 135,
    payoutPercentRate: 0.0025,
  },
  CZK: {
    stripeMinPayoutMinor: 3000,
    appMinPayoutMinor: 3000,
    monthlyActiveFeeMinor: 5000,
    payoutFixedFeeMinor: 800,
    payoutPercentRate: 0.0025,
  },
  SEK: {
    stripeMinPayoutMinor: 2000,
    appMinPayoutMinor: 2000,
    monthlyActiveFeeMinor: 1500,
    payoutFixedFeeMinor: 500,
    payoutPercentRate: 0.0025,
  },
  DKK: {
    stripeMinPayoutMinor: 2000,
    appMinPayoutMinor: 2000,
    monthlyActiveFeeMinor: 1500,
    payoutFixedFeeMinor: 500,
    payoutPercentRate: 0.0025,
  },
};

export function requirePayoutConfig(
  currency: string
): PayoutCurrencyConfig {
  const normalized = currency.toUpperCase() as CurrencyCode;
  const config = payoutConfig[normalized];

  if (!config) {
    throw new Error(`Unsupported payout currency: ${currency}`);
  }

  return config;
}
