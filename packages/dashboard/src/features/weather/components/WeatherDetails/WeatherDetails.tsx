import { Icon } from '@everdash/ui/ui/Icon/Icon';
import type { WeatherDetail } from '../../data/view';
import styles from './WeatherDetails.module.css';

/** row: all details in one line. grid: two to a line. */
export type DetailsLayout = 'row' | 'grid';

interface Props {
  details: readonly WeatherDetail[];
  layout: DetailsLayout;
}

/** Humidity, wind, pressure and precipitation as icon and value pairs. */
export function WeatherDetails({ details, layout }: Props) {
  if (details.length === 0) {
    return null;
  }

  return (
    <ul
      class={`${styles.details} ${layout === 'grid' ? styles.grid : styles.row}`}
      data-testid="weather-details"
    >
      {details.map((detail) => (
        <li key={detail.key} title={detail.label}>
          <Icon name={detail.icon} className={styles.detailIcon} />
          <span class={styles.hidden}>{detail.label}</span>
          <span>{detail.value}</span>
        </li>
      ))}
    </ul>
  );
}
