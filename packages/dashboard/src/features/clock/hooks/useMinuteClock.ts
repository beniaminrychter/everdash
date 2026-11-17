import { useEffect, useState } from 'preact/hooks';

const minuteMs = 60_000;
/** Lands just after the boundary, so the new minute is never read a hair early. */
const marginMs = 25;

/**
 * The current time, refreshed on each minute boundary. A tablet that slept through its timer
 * catches up when the page becomes visible again.
 */
export function useMinuteClock(): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    let timer = 0;

    const untilNextMinute = () => minuteMs - (Date.now() % minuteMs) + marginMs;
    const tick = () => {
      setNow(Date.now());
      timer = window.setTimeout(tick, untilNextMinute());
    };
    const resync = () => {
      if (document.visibilityState === 'visible') {
        window.clearTimeout(timer);
        tick();
      }
    };

    timer = window.setTimeout(tick, untilNextMinute());
    document.addEventListener('visibilitychange', resync);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', resync);
    };
  }, []);

  return now;
}
