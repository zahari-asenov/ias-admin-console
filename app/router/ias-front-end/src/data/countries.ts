import * as countryList from 'country-list';

// Get all countries: { code, name }[] - code is ISO 3166-1 alpha-2
const rawData = countryList.getData();

export const COUNTRIES = rawData
  .map((c) => ({ value: c.code, label: c.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const getCountryName = (code: string): string | undefined =>
  COUNTRIES.find((c) => c.value === code)?.label;
