export const formatNumber = (value: number, digits: number, locale: string) =>
  value.toLocaleString(locale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
