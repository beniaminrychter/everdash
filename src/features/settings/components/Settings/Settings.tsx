import { useState } from 'preact/hooks';
import { useI18n, translateMessage } from '../../../../shared/i18n/index';
import type { Language } from '../../../../shared/i18n/index';
import type { Appearance } from '../../data/preferences';
import { About } from '../About/About';
import styles from './Settings.module.css';

interface Props {
  appearance: Appearance;
  onAppearance: (mode: Appearance) => void;
  language: Language;
  onLanguage: (language: Language) => void;
  connection: string;
  online: boolean;
  onRefresh: () => void;
  sunAvailable: boolean;
  storageError: boolean;
  onHardReload: () => Promise<void>;
}
export function Settings({
  appearance,
  onAppearance,
  language,
  onLanguage,
  connection,
  online,
  onRefresh,
  sunAvailable,
  storageError,
  onHardReload,
}: Props) {
  const { t } = useI18n();
  const [reloading, setReloading] = useState(false);
  const [reloadError, setReloadError] = useState<string | null>(null);
  const reload = async () => {
    if (reloading) {
      return;
    }
    setReloading(true);
    setReloadError(null);
    try {
      await onHardReload();
    } catch (error) {
      setReloadError(error instanceof Error ? error.message : 'Hard reload failed. Please retry.');
      setReloading(false);
    }
  };
  const modes = [
    { label: t('Auto'), value: 'auto' },
    { label: t('Light'), value: 'light' },
    { label: t('Dark'), value: 'dark' },
  ] as const;
  return (
    <div class={styles.settings}>
      <h3>{t('Language')}</h3>
      <fieldset class={styles.modes} aria-label={t('Language')}>
        <div class={styles.modeOptions}>
          {(['en', 'pl'] as const).map((value) => (
            <button
              key={value}
              type="button"
              lang={value}
              aria-pressed={language === value}
              onClick={() => onLanguage(value)}
            >
              {value === 'pl' ? 'Polski' : 'English'}
            </button>
          ))}
        </div>
      </fieldset>
      <h3>{t('Appearance')}</h3>
      <fieldset class={styles.modes} aria-label={t('Appearance')}>
        <div class={styles.modeOptions}>
          {modes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              aria-pressed={mode.value === appearance}
              onClick={() => onAppearance(mode.value)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </fieldset>
      <p>
        {appearance === 'auto'
          ? sunAvailable
            ? t('Light at sunrise. Dark at sunset. Uses your Home Assistant sun state.')
            : t('Sun state unavailable. Auto follows this device’s appearance until it reconnects.')
          : appearance === 'dark'
            ? t('Always use dark appearance.')
            : t('Always use light appearance.')}
      </p>
      {storageError && (
        <p role="alert">
          {t('Preferences could not be saved on this device. They will reset after reopening.')}
        </p>
      )}
      <h3>Home Assistant</h3>
      <output aria-label={t('Home Assistant connection')} aria-live="polite">
        {connection}
      </output>
      <p class={styles.url}>{t('Connected through EverDash')}</p>
      <button type="button" class={styles.refresh} disabled={!online} onClick={onRefresh}>
        {t('Refresh')}
      </button>
      <h3>{t('App')}</h3>
      <button type="button" class={styles.refresh} disabled={!online || reloading} onClick={reload}>
        {reloading ? t('Reloading…') : t('Hard reload app')}
      </button>
      <p>
        {t(
          'Download the latest version and reset the app’s offline cache. Your dashboard and appearance stay saved.',
        )}
      </p>
      {reloadError && <p role="alert">{translateMessage(reloadError, t)}</p>}
      <details class={styles.install}>
        <summary>{t('Installation & about')}</summary>
        <About />
      </details>
    </div>
  );
}
