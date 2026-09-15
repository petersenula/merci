export type Market = "CH" | "EEA";

export type CurrencyCode =
  | "CHF"
  | "EUR"
  | "RON"
  | "HUF"
  | "PLN"
  | "CZK"
  | "SEK"
  | "DKK";

export type LocaleCode =
  | "en"
  | "de"
  | "fr"
  | "it"
  | "es"
  | "zh"
  | "pt"
  | "nl"
  | "bg"
  | "hr"
  | "sk"
  | "sl"
  | "et"
  | "lv"
  | "lt"
  | "fi"
  | "el";

export type CountryConfig = {
  code: string;
  label: string;
  currency: CurrencyCode;
};

export type MarketConfig = {
  market: Market;
  defaultCountry: string;
  defaultCurrency: CurrencyCode;
  defaultLocale: LocaleCode;
  countries: readonly CountryConfig[];
  userLocales: readonly LocaleCode[];
  paymentLocales: readonly LocaleCode[];
};

const CH_COUNTRIES: readonly CountryConfig[] = [
  { code: "CH", label: "Switzerland", currency: "CHF" },
  { code: "LI", label: "Liechtenstein", currency: "CHF" },
];

const EEA_SUPPORTED_COUNTRIES: readonly CountryConfig[] = [
  { code: "AT", label: "Austria", currency: "EUR" },
  { code: "BE", label: "Belgium", currency: "EUR" },
  { code: "BG", label: "Bulgaria", currency: "EUR" },
  { code: "HR", label: "Croatia", currency: "EUR" },
  { code: "CY", label: "Cyprus", currency: "EUR" },
  { code: "EE", label: "Estonia", currency: "EUR" },
  { code: "FI", label: "Finland", currency: "EUR" },
  { code: "FR", label: "France", currency: "EUR" },
  { code: "DE", label: "Germany", currency: "EUR" },
  { code: "GR", label: "Greece", currency: "EUR" },
  { code: "IE", label: "Ireland", currency: "EUR" },
  { code: "IT", label: "Italy", currency: "EUR" },
  { code: "LV", label: "Latvia", currency: "EUR" },
  { code: "LT", label: "Lithuania", currency: "EUR" },
  { code: "LU", label: "Luxembourg", currency: "EUR" },
  { code: "MT", label: "Malta", currency: "EUR" },
  { code: "NL", label: "Netherlands", currency: "EUR" },
  { code: "PT", label: "Portugal", currency: "EUR" },
  { code: "SK", label: "Slovakia", currency: "EUR" },
  { code: "SI", label: "Slovenia", currency: "EUR" },
  { code: "ES", label: "Spain", currency: "EUR" },

  { code: "RO", label: "Romania", currency: "RON" },
  { code: "HU", label: "Hungary", currency: "HUF" },
  { code: "PL", label: "Poland", currency: "PLN" },
  { code: "CZ", label: "Czechia", currency: "CZK" },
  { code: "SE", label: "Sweden", currency: "SEK" },
  { code: "DK", label: "Denmark", currency: "DKK" },
];

export const marketConfigs: Record<Market, MarketConfig> = {
  CH: {
    market: "CH",
    defaultCountry: "CH",
    defaultCurrency: "CHF",
    defaultLocale: "de",
    countries: CH_COUNTRIES,
    userLocales: ["en", "de", "fr", "it"],
    paymentLocales: ["en", "de", "fr", "it", "es", "zh"],
  },

  EEA: {
    market: "EEA",
    defaultCountry: "DE",
    defaultCurrency: "EUR",
    defaultLocale: "en",
    countries: EEA_SUPPORTED_COUNTRIES,
    userLocales: [
      "en",
      "de",
      "fr",
      "it",
      "es",
      "pt",
      "nl",
      "bg",
      "hr",
      "sk",
      "sl",
      "et",
      "lv",
      "lt",
      "fi",
      "el",
    ],
    paymentLocales: [
      "en",
      "de",
      "fr",
      "it",
      "es",
      "pt",
      "nl",
      "bg",
      "hr",
      "sk",
      "sl",
      "et",
      "lv",
      "lt",
      "fi",
      "el",
    ],
  },
};

export function getCountryConfig(
  market: Market,
  countryCode: string
): CountryConfig | undefined {
  return marketConfigs[market].countries.find(
    (country) => country.code === countryCode.toUpperCase()
  );
}

export function getActiveMarket(): Market {
  return process.env.NEXT_PUBLIC_MARKET === "EEA" ? "EEA" : "CH";
}

export function getActiveMarketConfig(): MarketConfig {
  return marketConfigs[getActiveMarket()];
}
