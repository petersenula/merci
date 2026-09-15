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

  /**
   * Do not silently reuse Swiss pricing here.
   *
   * EEA pricing will be added explicitly after we
   * verify Stripe pricing for each required currency /
   * payment setup.
   */
  EEA: {},
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
