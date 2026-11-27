import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { bcp47Locale, resolveLanguage } from '@everdash/ui/i18n/locale';
import type { Language } from '@everdash/ui/i18n/locale';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { setLocale } from '@everdash/ui/i18n/paraglide/runtime.js';

export type AdminLanguagePreference = 'auto' | Language;

const ADMIN_LANGUAGE_STORAGE_KEY = 'everdash:admin-language:v1';

function readStoredLanguagePreference(): AdminLanguagePreference {
  try {
    const stored = window.localStorage.getItem(ADMIN_LANGUAGE_STORAGE_KEY);

    if (stored === 'en' || stored === 'pl') {
      return stored;
    }
  } catch {
    // Ignore storage errors in restricted contexts.
  }

  return 'auto';
}

function saveStoredLanguagePreference(preference: AdminLanguagePreference): void {
  try {
    if (preference === 'auto') {
      window.localStorage.removeItem(ADMIN_LANGUAGE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(ADMIN_LANGUAGE_STORAGE_KEY, preference);
    }
  } catch {
    // Ignore storage errors in restricted contexts.
  }
}

interface AdminLocaleContextValue {
  locale: Language;
  bcp47: string;
  preference: AdminLanguagePreference;
  setPreference: (preference: AdminLanguagePreference) => void;
}

const AdminLocaleContext = createContext<AdminLocaleContextValue>({
  locale: 'en',
  bcp47: 'en-GB',
  preference: 'auto',
  setPreference: () => undefined,
});

export function AdminI18nProvider({
  language,
  children,
}: {
  language?: string;
  children: ReactNode;
}) {
  const [preference, setPreference] = useState<AdminLanguagePreference>(
    readStoredLanguagePreference,
  );
  const locale = preference === 'auto' ? resolveLanguage(language) : preference;
  const bcp47 = bcp47Locale(locale);

  const updatePreference = useCallback((next: AdminLanguagePreference) => {
    saveStoredLanguagePreference(next);
    setPreference(next);
  }, []);

  // Set synchronously before children render so `m.*()` calls read the active locale immediately.
  setLocale(locale, { reload: false });

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = m.admin_title();
  }, [locale]);

  const value = useMemo(
    () => ({ locale, bcp47, preference, setPreference: updatePreference }),
    [locale, bcp47, preference, updatePreference],
  );

  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>;
}

export function useAdminLocale(): AdminLocaleContextValue {
  return useContext(AdminLocaleContext);
}

/** Selects the right singular/few/many form for English and Polish counts. */
export function pluralize(
  count: number,
  forms: {
    one: (params: { count: number }) => string;
    few: (params: { count: number }) => string;
    many: (params: { count: number }) => string;
  },
): string {
  const abs = Math.abs(count);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (abs === 1) {
    return forms.one({ count });
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms.few({ count });
  }

  return forms.many({ count });
}
