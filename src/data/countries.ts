import { getActiveMarketConfig } from "@/lib/marketConfig";

export type CountryOption = {
  code: string;
  label: string;
};

const activeMarket = getActiveMarketConfig();

export const topCountries: CountryOption[] =
  activeMarket.countries.map(({ code, label }) => ({
    code,
    label,
  }));

export const allCountries: CountryOption[] = [
  ...topCountries,
];
