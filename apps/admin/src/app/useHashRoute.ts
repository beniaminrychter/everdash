import { useEffect, useRef, useState } from 'react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';

export type Route = 'editor' | 'settings' | 'json' | 'devices' | 'home-assistant';

const validRoutes = new Set<Route>(['editor', 'settings', 'json', 'devices', 'home-assistant']);

export function routeTitle(route: Route): string {
  switch (route) {
    case 'editor': {
      return m.admin_route_editor();
    }

    case 'settings': {
      return m.admin_route_settings();
    }

    case 'json': {
      return m.admin_route_json();
    }

    case 'devices': {
      return m.admin_route_devices();
    }

    case 'home-assistant': {
      return m.admin_route_home_assistant();
    }

    default: {
      return m.admin_route_editor();
    }
  }
}

/** Returns true to keep the current page, for example while it has unapplied edits. */
type RouteBlocker = (target: Route) => boolean;

let routeBlocker: RouteBlocker | null = null;

export function setRouteBlocker(blocker: RouteBlocker | null) {
  routeBlocker = blocker;
}

function isRoute(value: string): value is Route {
  return validRoutes.has(value as Route);
}

function readRoute(): Route {
  const name = window.location.hash.replace(/^#\/?/, '');

  if (name === 'tablets') {
    return 'devices';
  }

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
