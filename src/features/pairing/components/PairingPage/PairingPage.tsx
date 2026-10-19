import { useState } from 'preact/hooks';
import { LanguageProvider, createTranslator } from '../../../../shared/i18n/index';
import type { Language } from '../../../../shared/i18n/index';
import { PairingPanel } from '../PairingPanel/PairingPanel';
import styles from './PairingPage.module.css';

interface PairingPageProps {
  mode: 'tablet' | 'management' | 'error';
  message?: string;
  onRetry?: () => void;
}

export function PairingPage({ mode, message, onRetry }: PairingPageProps) {
  const [language, setLanguage] = useState<Language>('en');
  const t = createTranslator(language);
  return (
    <LanguageProvider language={language}>
      <main class={styles.page}>
        <div class={styles.card}>
          <div class={styles.language} aria-label={t('Language')}>
            <button
              type="button"
              lang="en"
              aria-pressed={language === 'en'}
              onClick={() => setLanguage('en')}
            >
              English
            </button>
            <button
              type="button"
              lang="pl"
              aria-pressed={language === 'pl'}
              onClick={() => setLanguage('pl')}
            >
              Polski
            </button>
          </div>
          <p class={styles.brand}>EverDash</p>
          <h1>
            {mode === 'tablet'
              ? t('Give this tablet a new purpose.')
              : t('Home Assistant access required')}
          </h1>
          {mode === 'tablet' && <PairingPanel mode="tablet" />}
          {mode === 'management' && (
            <p role="alert">
              {t('Open EverDash inside Home Assistant while signed in to an authorized account.')}
            </p>
          )}
          {mode === 'error' && (
            <>
              <p class={styles.error} role="alert">
                {message ?? t('EverDash could not be reached. Check the connection and retry.')}
              </p>
              {onRetry && (
                <button type="button" onClick={onRetry}>
                  {t('Retry')}
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </LanguageProvider>
  );
}
