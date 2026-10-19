import type { Language } from '../../../shared/i18n/index';

export type Appearance = 'auto' | 'dark' | 'light';
export interface Preferences {
  page: string;
  appearance: Appearance;
  language: Language;
}
export const preferenceKey = 'my-home:preferences:v1';
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;
export function readPreferences(
  storage: PreferenceStorage,
  pages: readonly { id: string }[],
): Preferences {
  const fallback: Preferences = { appearance: 'auto', language: 'en', page: pages[0].id };
  try {
    const value: unknown = JSON.parse(storage.getItem(preferenceKey) || 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return fallback;
    }
    const saved = value as Partial<Preferences>;
    return {
      appearance: ['auto', 'dark', 'light'].includes(saved.appearance || '')
        ? saved.appearance!
        : 'auto',
      language: saved.language === 'pl' ? 'pl' : 'en',
      page: pages.some((page) => page.id === saved.page) ? saved.page! : fallback.page,
    };
  } catch {
    return fallback;
  }
}
export function savePreferences(storage: PreferenceStorage, value: Preferences): boolean {
  try {
    storage.setItem(preferenceKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function resolveTheme(
  mode: Appearance,
  sun: string | undefined,
  systemDark: boolean,
): 'light' | 'dark' {
  if (mode !== 'auto') {
    return mode;
  }
  if (sun === 'above_horizon') {
    return 'light';
  }
  if (sun === 'below_horizon') {
    return 'dark';
  }
  return systemDark ? 'dark' : 'light';
}
