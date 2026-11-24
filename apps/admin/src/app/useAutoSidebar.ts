import { useCallback, useEffect, useState } from 'react';

const query = (breakpoint: number) => `(min-width: ${breakpoint}px)`;

/**
 * Open state for the sidebar that follows the window: open on wide windows, an icon rail on
 * narrow ones. A manual toggle holds until the window next crosses the breakpoint. The same rule
 * applies inside Home Assistant and standalone, since it depends only on the width.
 */
export function useAutoSidebar(breakpoint = 1100) {
  const [open, setOpen] = useState(() => window.matchMedia(query(breakpoint)).matches);

  useEffect(() => {
    const media = window.matchMedia(query(breakpoint));
    const onChange = (event: MediaQueryListEvent) => setOpen(event.matches);

    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, [breakpoint]);

  const onOpenChange = useCallback((next: boolean) => setOpen(next), []);

  return { open, onOpenChange };
}
