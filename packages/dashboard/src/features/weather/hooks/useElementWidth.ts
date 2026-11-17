import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';

/**
 * The width of an element in px, measured after every render and when the window is resized, or
 * undefined until it has been measured. The element's width must not depend on its own content.
 */
export function useElementWidth<T extends HTMLElement>(): [RefObject<T>, number | undefined] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);

  const measure = () => {
    const next = ref.current ? ref.current.offsetWidth : undefined;

    setWidth((previous) => (previous === next ? previous : next));
  };

  useLayoutEffect(measure);

  useLayoutEffect(() => {
    window.addEventListener('resize', measure);

    return () => window.removeEventListener('resize', measure);
  }, []);

  return [ref, width];
}
