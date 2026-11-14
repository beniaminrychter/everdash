export interface Staleness {
  key: 'Updated less than a minute ago' | 'Updated {minutes} min ago' | 'Updated {hours} h ago';
  values: Readonly<Record<string, number>>;
}

/** Describes how old the last successful reading is, or null when nothing has succeeded yet. */
export function describeStaleness(updatedAt: number | null, now: number): Staleness | null {
  if (updatedAt === null) {
    return null;
  }

  const minutes = Math.max(0, Math.floor((now - updatedAt) / 60_000));
  if (minutes < 1) {
    return { key: 'Updated less than a minute ago', values: {} };
  }

  if (minutes < 60) {
    return { key: 'Updated {minutes} min ago', values: { minutes } };
  }

  return { key: 'Updated {hours} h ago', values: { hours: Math.floor(minutes / 60) } };
}

/** The most recent successful update across several stores. */
export function latestUpdate(times: readonly (number | null)[]): number | null {
  let latest: number | null = null;
  for (const time of times) {
    if (time !== null && (latest === null || time > latest)) {
      latest = time;
    }
  }

  return latest;
}

export interface StoreFreshness {
  error: string | null;
  updatedAt: number | null;
}

/**
 * When the data that is currently failing was last good: the oldest success among the stores in
 * error. With no failing store (for example while offline) it falls back to the newest success.
 */
export function staleSince(stores: readonly StoreFreshness[]): number | null {
  const failing = stores
    .filter((store) => store.error && store.updatedAt !== null)
    .map((store) => store.updatedAt);
  if (failing.length > 0) {
    return Math.min(...(failing as number[]));
  }

  return latestUpdate(stores.map((store) => store.updatedAt));
}
