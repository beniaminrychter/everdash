import type { ClockDisplay } from '@everdash/contracts/config/types';

export interface ClockText {
  /** The large line: the time, or the weekday when only the date is shown. */
  primary: string;
  /** The smaller line below it. */
  secondary?: string;
}

/** Formats a timestamp in the device's own time zone for the dashboard locale. */
export function formatClock(now: number, display: ClockDisplay, locale: string): ClockText {
  const date = new Date(now);
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  if (display === 'time') {
    return { primary: time };
  }

  if (display === 'date') {
    return {
      primary: date.toLocaleDateString(locale, { weekday: 'long' }),
      secondary: date.toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
    };
  }

  return {
    primary: time,
    secondary: date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
  };
}
