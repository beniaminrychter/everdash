const formatters = new Map<string, Intl.DateTimeFormat>();

// Pstryk versions without UTC offsets publish wall-clock times in HA's timezone.
// Resolve both sides of a DST transition; omit gaps and ambiguous hours.
export function parseScheduleTime(value: unknown, timeZone?: string): number {
  if (typeof value !== 'string') {
    return NaN;
  }

  if (/T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    return Date.parse(value);
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (!match || !timeZone) {
    return NaN;
  }

  const [, year, month, day, hour, minute, second = '0'] = match;
  const wall = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second);
  const date = new Date(wall);

  if (
    date.getUTCFullYear() !== +year ||
    date.getUTCMonth() !== +month - 1 ||
    date.getUTCDate() !== +day ||
    date.getUTCHours() !== +hour ||
    date.getUTCMinutes() !== +minute ||
    date.getUTCSeconds() !== +second
  ) {
    return NaN;
  }

  try {
    let formatter = formatters.get(timeZone);

    if (!formatter) {
      formatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        month: '2-digit',
        second: '2-digit',
        timeZone,
        year: 'numeric',
      });
      formatters.set(timeZone, formatter);
    }

    const localEpoch = (time: number) => {
      const fields: Record<string, number> = {};

      formatter.formatToParts(new Date(time)).forEach((part) => {
        if (part.type !== 'literal') {
          fields[part.type] = Number(part.value);
        }
      });

      return Date.UTC(
        fields.year,
        fields.month - 1,
        fields.day,
        fields.hour % 24,
        fields.minute,
        fields.second,
      );
    };
    const candidates = new Set<number>();

    [-86_400_000, 0, 86_400_000].forEach((delta) => {
      const sample = wall + delta;
      const candidate = wall - (localEpoch(sample) - sample);

      if (localEpoch(candidate) === wall) {
        candidates.add(candidate);
      }
    });

    return candidates.size === 1 ? [...candidates][0] : Number.NaN;
  } catch {
    return Number.NaN;
  }
}
