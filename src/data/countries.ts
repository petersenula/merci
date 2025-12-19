export type CountryOption = {
  code: string;
  label: string;
};

// PRIORITY COUNTRIES (always on top)
export const topCountries: CountryOption[] = [
  { code: "CH", label: "Switzerland" },
  { code: "LI", label: "Liechtenstein" },
];

// ALL COUNTRIES — ISO 3166 FULL LIST
export const allCountries: CountryOption[] = [
  ...topCountries,
  
];
