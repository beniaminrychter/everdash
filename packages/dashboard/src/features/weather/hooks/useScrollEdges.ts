import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

export interface ScrollEdges {
  /** Content is hidden before the visible area. */
  start: boolean;
  /** Content is hidden after the visible area. */
  end: boolean;
}

/**
 * Tracks whether a horizontally scrolling element has more to reveal on either side, so the
 * card can fade the edge that hints at it. Re-measures when `layoutKey` changes or the window resizes.
 */
export function useScrollEdges<T extends HTMLElement>(layoutKey: string) {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState<ScrollEdges>({ end: false, start: false });
  const update = useCallback(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const start = element.scrollLeft > 1;
    const end = element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
    setEdges((previous) =>
      previous.start === start && previous.end === end ? previous : { end, start },
    );
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update, layoutKey]);

  return { edges, ref, update };
}
