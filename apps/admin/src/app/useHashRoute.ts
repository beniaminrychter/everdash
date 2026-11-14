import { useEffect, useRef, useState } from 'react';

export type Route = 'editor' | 'settings' | 'json' | 'tablets' | 'home-assistant';

export const routeTitles: Record<Route, string> = {
  editor: 'Editor',
  settings: 'Dashboard settings',
  json: 'JSON import / export',
  tablets: 'Tablets & PIN',
  'home-assistant': 'Home Assistant',
};

/** Returns true to keep the current page, for example while it has unapplied edits. */
type RouteBlocker = (target: Route) => boolean;

let routeBlocker: RouteBlocker | null = null;

export function setRouteBlocker(blocker: RouteBlocker | null) {
  routeBlocker = blocker;
}

function isRoute(value: string): value is Route {
  return Object.prototype.hasOwnProperty.call(routeTitles, value);
}

function readRoute(): Route {
  const name = window.location.hash.replace(/^#\/?/, '');

  return isRoute(name) ? name : 'editor';
}

export function navigateTo(route: Route) {
  // Ask before touching the hash, so a blocked in-app link adds no history entry.
  if (route !== readRoute() && routeBlocker?.(route)) {
    return;
  }

  window.location.hash = `/${route}`;
}

export function useHashRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(readRoute);
  const current = useRef(route);

  useEffect(() => {
    const sync = () => {
      const next = readRoute();

      if (next !== current.current && routeBlocker?.(next)) {
        // Put the address bar back, so refresh and back/forward still match the page.
        window.history.replaceState(null, '', `#/${current.current}`);

        return;
      }

      current.current = next;
      setRoute(next);
    };

    window.addEventListener('hashchange', sync);

    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return [route, navigateTo];
}
