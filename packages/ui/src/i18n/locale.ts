export type Language = 'en' | 'pl';

/**
 * Resolves a Home Assistant or BCP-47 language code to a supported UI language.
 * Polish locales (`pl`, `pl-PL`, `pl_PL`) map to `'pl'`; everything else falls back to `'en'`.
 */
export function resolveLanguage(value?: string | null): Language {
  if (!value) {
    return 'en';
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === 'pl' || normalized.startsWith('pl-') || normalized.startsWith('pl_')) {
    return 'pl';
  }

  return 'en';
}

export function bcp47Locale(language: Language): string {
  return language === 'pl' ? 'pl-PL' : 'en-GB';
}
