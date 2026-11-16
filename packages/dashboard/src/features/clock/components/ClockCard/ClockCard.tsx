import { useI18n } from '@everdash/ui/i18n/index';
import type { CardSize } from '@everdash/contracts/config/cardSize';
import type { ClockDisplay } from '@everdash/contracts/config/types';
import { formatClock } from '../../data/format';
import { useMinuteClock } from '../../hooks/useMinuteClock';
import styles from './ClockCard.module.css';

interface Props {
  /** A custom name, shown as a heading. Without one the heading is only read by assistive tech. */
  title?: string;
  titleId: string;
  display: ClockDisplay;
  size: CardSize;
}

const sizeClasses: Record<CardSize, string> = {
  third: styles.third,
  half: styles.half,
  full: styles.full,
};

export function ClockCard({ title, titleId, display, size }: Props) {
  const { t, locale } = useI18n();
  const now = useMinuteClock();
  const text = formatClock(now, display, locale);
  const classes = [styles.clock, sizeClasses[size], display === 'date' ? styles.dateOnly : '']
    .filter(Boolean)
    .join(' ');

  return (
    <section class={classes} aria-labelledby={titleId} data-testid="clock-card">
      <h2 id={titleId} class={title ? styles.title : styles.hiddenTitle}>
        {title || t('Time and date')}
      </h2>
      <time dateTime={new Date(now).toISOString()}>
        <strong class={styles.primary}>{text.primary}</strong>
        {text.secondary && <span class={styles.secondary}>{text.secondary}</span>}
      </time>
    </section>
  );
}
