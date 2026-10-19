export const formatEnergyValue = (value: number | null, locale: string) =>
  value === null
    ? '—'
    : value.toLocaleString(locale, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
