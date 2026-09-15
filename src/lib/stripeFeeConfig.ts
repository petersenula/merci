import type {
  CurrencyCode,
  Market,
} from "@/lib/marketConfig";

export type StripeFeeProfile = {
  /**
   * Stripe percentage fee expressed as a decimal.
   *
   * Example:
   * 0.029 = 2.9%
   */
  percentRate: number;

  /**
   * Fixed Stripe fee in the currency's minor unit.
   *
   * Example:
   * CHF 0.30 = 30
   */
  fixedFeeMinor: number;

  /**
   * Human-readable internal identifier.
   * Useful when pricing changes and we need to know
   * which tariff a calculation used.
   */
  pricingKey: string;
};

type MarketStripeFeeConfig = Partial<
  Record<CurrencyCode, StripeFeeProfile>
>;

const STRIPE_FEE_CONFIG: Record<
  Market,
  MarketStripeFeeConfig
> = {
  CH: {
    /**
     * Existing Click4Tip calculation.
     *
     * This preserves current Swiss behaviour exactly.
     * We will review/update this separately against
     * Stripe's current pricing.
     */
    CHF: {
      percentRate: 0.029,
      fixedFeeMinor: 30,
      pricingKey: "chf_legacy_standard",
    },
  },

  EEA: {
    EUR: {
      percentRate: 0.019,
      fixedFeeMinor: 25,
      pricingKey: "eea_blended_2026_10",
    },
    RON: {
      percentRate: 0.019,
      fixedFeeMinor: 100,
      pricingKey: "eea_blended_2026_10",
    },
    HUF: {
      percentRate: 0.019,
      fixedFeeMinor: 8500,
      pricingKey: "eea_blended_2026_10",
    },
    PLN: {
      percentRate: 0.019,
      fixedFeeMinor: 100,
      pricingKey: "eea_blended_2026_10",
    },
    CZK: {
      percentRate: 0.019,
      fixedFeeMinor: 650,
      pricingKey: "eea_blended_2026_10",
    },
    SEK: {
      percentRate: 0.019,
      fixedFeeMinor: 180,
      pricingKey: "eea_blended_2026_10",
    },
    DKK: {
      percentRate: 0.019,
      fixedFeeMinor: 180,
      pricingKey: "eea_blended_2026_10",
    },
  },
};

export function getStripeFeeProfile(
  market: Market,
  currency: CurrencyCode
): StripeFeeProfile | undefined {
  return STRIPE_FEE_CONFIG[market][currency];
}

export function requireStripeFeeProfile(
  market: Market,
  currency: CurrencyCode
): StripeFeeProfile {
  const profile = getStripeFeeProfile(
    market,
    currency
  );

  if (!profile) {
    throw new Error(
      `Stripe fee profile is not configured for ${market}/${currency}`
    );
  }

  return profile;
}
