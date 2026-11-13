import { useCallback, useEffect, useState } from 'react';
import { navigateTo, setRouteBlocker } from '@/app/useHashRoute';
import type { Route } from '@/app/useHashRoute';

/**
 * Keeps the person on the JSON page while the text has unapplied edits. `apply` must return
 * true when the JSON was valid and applied.
 */
export function useJsonGuard(dirty: boolean, apply: () => boolean) {
  const [target, setTarget] = useState<Route | null>(null);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    setRouteBlocker((next) => {
      setTarget(next);

      return true;
    });

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warn);

    return () => {
      setRouteBlocker(null);
      window.removeEventListener('beforeunload', warn);
    };
  }, [dirty]);

  const leave = useCallback(
    (applyFirst: boolean) => {
      const next = target;

      setTarget(null);

      if (applyFirst && !apply()) {
        return;
      }

      setRouteBlocker(null);

      if (next) {
        navigateTo(next);
      }
    },
    [apply, target],
  );

  return {
    open: target !== null,
    keepEditing: () => setTarget(null),
    discardAndLeave: () => leave(false),
    applyAndLeave: () => leave(true),
  };
}
