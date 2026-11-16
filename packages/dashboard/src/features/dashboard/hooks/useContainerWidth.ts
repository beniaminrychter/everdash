import { useLayoutEffect, useState } from 'preact/hooks';
import type { RefObject } from 'preact';

/** What the width is until the container has been measured, before the first paint. */
function guess(): number {
  return typeof window === 'undefined' ? 1024 : window.innerWidth;
}

/**
 * The width of an element, kept up to date as it or the window resizes. The cards' layout follows
 * the container (not the window), so the editor preview, which sits beside an inspector, lays out
 * exactly as a tablet of the same width would. ResizeObserver is missing on iOS 12, where the
 * container only changes with the window.
 */
export function useContainerWidth(element: RefObject<HTMLElement>): number {
  const [width, setWidth] = useState(guess);

  useLayoutEffect(() => {
    const measure = () => {
      const measured = element.current?.getBoundingClientRect().width;

      if (measured) {
        setWidth(Math.round(measured));
      }
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);

    if (element.current) {
      observer?.observe(element.current);
    }

    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      observer?.disconnect();
    };
  }, [element]);

  return width;
}
