import { useCallback, useEffect, useState } from 'react';

export type Route = 'editor' | 'settings' | 'json' | 'tablets' | 'home-assistant';

export const routeTitles: Record<Route, string> = {
  editor: 'Editor',
  settings: 'Dashboard settings',
  json: 'JSON import / export',
  tablets: 'Tablets & PIN',
  'home-assistant': 'Home Assistant',
};

function isRoute(value: string): value is Route {
  return Object.prototype.hasOwnProperty.call(routeTitles, value);
}

function readRoute(): Route {
  const name = window.location.hash.replace(/^#\/?/, '');

  return isRoute(name) ? name : 'editor';
}

export function useHashRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const sync = () => setRoute(readRoute());

    window.addEventListener('hashchange', sync);

    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = `/${next}`;
  }, []);

  return [route, navigate];
}
