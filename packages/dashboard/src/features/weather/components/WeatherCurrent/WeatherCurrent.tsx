import type { CardSize } from '@everdash/contracts/config/cardSize';
import { Icon } from '@everdash/ui/ui/Icon/Icon';
import type { WeatherView } from '../../data/view';
import styles from './WeatherCurrent.module.css';

/**
 * glance: temperature, condition and short high / low stacked.
 * inline: temperature, then one line of condition and short high / low.
 * large: temperature with its condition beside it, then feels-like and the full high / low.
 */
export type CurrentVariant = 'glance' | 'inline' | 'large';

interface Props {
  view: WeatherView;
  variant: CurrentVariant;
  size: CardSize;
}

const variantClasses: Record<CurrentVariant, string> = {
  glance: styles.glance,
  inline: styles.inline,
  large: styles.large,
};
/** A quarter is the base size; a half and a full row get larger type. */
const sizeClasses: Record<CardSize, string> = {
  quarter: '',
  half: styles.half,
  full: styles.full,
};

/** The current conditions of a weather card. */
export function WeatherCurrent({ view, variant, size }: Props) {
  const classes = `${styles.current} ${variantClasses[variant]} ${sizeClasses[size]}`;
  const temperature = (
    <strong class={styles.temperature} data-testid="weather-temperature">
      {view.temperature}
    </strong>
  );
  const shortRange = (view.highShort !== null || view.lowShort !== null) && (
    <p class={styles.range} data-testid="weather-range">
      {view.highShort !== null && <span>{view.highShort}</span>}
      {view.lowShort !== null && <span>{view.lowShort}</span>}
    </p>
  );

  if (variant === 'large') {
    return (
      <div class={classes}>
        <Icon name={view.icon} className={styles.currentIcon} />
        <div class={styles.readout}>
          <div class={styles.primaryRow}>
            {temperature}
            <p class={styles.condition}>{view.condition}</p>
          </div>
          {(view.feelsLike !== null || view.high !== null || view.low !== null) && (
            <div class={styles.metaRow}>
              {view.feelsLike !== null && (
                <p class={styles.note} data-testid="weather-feels-like">
                  {view.feelsLike}
                </p>
              )}
              {(view.high !== null || view.low !== null) && (
                <p class={styles.range} data-testid="weather-range">
                  {view.high !== null && <span>{view.high}</span>}
                  {view.low !== null && <span>{view.low}</span>}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div class={classes}>
      <Icon name={view.icon} className={styles.currentIcon} />
      <div class={styles.readout}>
        {temperature}
        {variant === 'glance' ? (
          <>
            <p class={styles.condition}>{view.condition}</p>
            {shortRange}
          </>
        ) : (
          <div class={styles.metaRow}>
            <p class={styles.condition}>{view.condition}</p>
            {shortRange}
          </div>
        )}
      </div>
    </div>
  );
}
