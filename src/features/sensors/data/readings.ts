import type { Entity } from '../../../shared/home-assistant/entities';
import { formatTemperature, hasState } from '../../../shared/dashboard/readings';

const number = (value: unknown): number | null => {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
    return null;
  }
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};
export function sensorValue(entity: Entity | undefined, locale = 'en-GB') {
  if (!hasState(entity)) {
    return { available: false, value: 'Unavailable', unit: '' };
  }
  const numeric = number(entity.state);
  let value =
    numeric === null
      ? entity.state.replace(/_/g, ' ')
      : numeric.toLocaleString(locale, { maximumFractionDigits: 2 });
  if (
    numeric !== null &&
    (entity.attributes.device_class === 'temperature' ||
      ['°C', '°F'].includes(String(entity.attributes.unit_of_measurement)))
  ) {
    value = formatTemperature(numeric, locale);
  }
  if (entity.entity_id.startsWith('binary_sensor.')) {
    const kind = String(entity.attributes.device_class || '');
    const labels = ['window', 'door', 'garage_door', 'opening'].includes(kind)
      ? ['Closed', 'Open']
      : ['motion', 'occupancy', 'presence'].includes(kind)
        ? ['Clear', 'Detected']
        : ['smoke', 'gas', 'moisture', 'safety', 'problem'].includes(kind)
          ? ['Clear', 'Alert']
          : ['Off', 'On'];
    value = entity.state === 'on' ? labels[1] : entity.state === 'off' ? labels[0] : value;
  }
  return {
    available: true,
    unit:
      typeof entity.attributes.unit_of_measurement === 'string'
        ? entity.attributes.unit_of_measurement
        : '',
    value,
  };
}
