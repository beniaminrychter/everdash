import { polish } from './messages';
import type { Language, TranslationKey } from './messages';

export type Translator = (
  key: TranslationKey,
  values?: Readonly<Record<string, string | number>>,
) => string;
export function createTranslator(language: Language): Translator {
  return (key, values = {}) =>
    (language === 'pl' ? polish[key] : key).replace(/\{(\w+)\}/g, (match, name: string) =>
      String(values[name] ?? match),
    );
}
export function translateText(text: string, t: Translator): string {
  return Object.prototype.hasOwnProperty.call(polish, text) ? t(text as TranslationKey) : text;
}
export function translateMessage(message: string, t: Translator): string {
  const update = message.match(/^Couldn’t update (.+)\.$/);
  if (update) {
    return t('Couldn’t update {name}.', { name: update[1] });
  }
  const http = message.match(/^Home Assistant request failed \(HTTP (\d+)\)\.$/);
  if (http) {
    return t('Home Assistant request failed (HTTP {status}).', {
      status: http[1],
    });
  }
  return translateText(message, t);
}
