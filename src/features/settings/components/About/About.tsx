import { useI18n } from '../../../../shared/i18n/index';
import styles from './About.module.css';

export function About() {
  const { t } = useI18n();
  return (
    <div class={styles.aboutContent}>
      <p>
        {t(
          'A simple home dashboard, made for your iPad. Accessory states and controls connect through EverDash to Home Assistant.',
        )}
      </p>
      <h3>{t('Add to your Home Screen')}</h3>
      <ol>
        <li>{t('Open this address in Safari.')}</li>
        <li>{t('Tap Share, then Add to Home Screen.')}</li>
        <li>{t('Tap Add. Your home is one tap away.')}</li>
      </ol>
      <p class={styles.aboutNote}>
        {t(
          'Adding to your Home Screen and offline launch need a secure HTTPS connection. Live states and controls always require a connection to Home Assistant.',
        )}
      </p>
      <p class={styles.aboutVersion}>{t('EverDash · Home Assistant dashboard')}</p>
    </div>
  );
}
