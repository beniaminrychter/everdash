import { useEffect, useState } from 'preact/hooks';
import type { Language } from '@everdash/ui/i18n/index';
import { readPreferences, savePreferences, resolveTheme, preferenceKey } from '../data/preferences';
import type { Preferences } from '../data/preferences';

export function usePreferences(
  pages: readonly { id: string }[],
  sun: string | undefined,
  defaultLanguage: Language = 'en',
) {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      return readPreferences(window.localStorage, pages, defaultLanguage);
    } catch {
      return { appearance: 'auto', language: defaultLanguage, page: pages[0].id };
    }
  });
  const [storageError, setStorageError] = useState(false);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    // Safari 12 uses the original MediaQueryList listener API.
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);
  useEffect(() => {
    try {
      setStorageError(!savePreferences(window.localStorage, preferences));
    } catch {
      setStorageError(true);
    }
  }, [preferences]);
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key === preferenceKey || event.key === null) {
        try {
          setPreferences(readPreferences(window.localStorage, pages, defaultLanguage));
        } catch {
          setStorageError(true);
        }
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, [defaultLanguage, pages]);
  const theme = resolveTheme(preferences.appearance, sun, systemDark);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', theme === 'light' ? '#e4eaf1' : '#202b3a');
  }, [theme]);
  return { preferences, setPreferences, storageError };
}
