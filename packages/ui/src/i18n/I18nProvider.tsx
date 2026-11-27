import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext, useMemo } from 'preact/hooks';
import { bcp47Locale } from './locale';
import type { Language } from './locale';
import { createTranslator } from './translator';

const LanguageContext = createContext<Language>('en');

export function LanguageProvider({
  language,
  children,
}: {
  language: Language;
  children: ComponentChildren;
}) {
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const language = useContext(LanguageContext);
  const t = useMemo(() => createTranslator(language), [language]);
  return { language, locale: bcp47Locale(language), t };
}
