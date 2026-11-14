import type { Entity } from '../../../shared/home-assistant/entities';
import { hasState } from '../../../shared/dashboard/readings';
import { isRecord } from '../../../shared/home-assistant/entities';
import { parseScheduleTime } from '../../../shared/time/schedule';

const number = (value: unknown): number | null => {
  if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') {
    return null;
  }
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};
export function powerKilowatts(entity: Entity | undefined): number | null {
  if (!hasState(entity)) {
    return null;
  }
  const value = number(entity.state);
  const unit = entity.attributes.unit_of_measurement;
  if (value === null || (unit !== 'W' && unit !== 'kW')) {
    return null;
  }
  return unit === 'W' ? value / 1000 : value;
}

function price(entity: Entity | undefined) {
  if (!hasState(entity)) {
    return null;
  }
  const value = number(entity.state);
  const unit = String(entity.attributes.unit_of_measurement || '').replace(/\s/g, '');
  const match = unit.match(/^(PLN|zł|zl|EUR)\/(kWh|MWh)$/i);
  if (value === null || !match) {
    return null;
  }
  const divisor = match[2].toLowerCase() === 'mwh' ? 1000 : 1;
  return {
    currency: /^(zł|zl)$/i.test(match[1]) ? 'PLN' : match[1].toUpperCase(),
    divisor,
    value: value / divisor,
  };
}
export interface PriceSlot {
  time: number;
  end: number;
  price: number;
}
export function mapEnergy(
  buyEntity: Entity | undefined,
  sellEntity: Entity | undefined,
  nextEntity: Entity | undefined,
  now: number,
  scheduleEntity?: Entity,
  timeZone?: string,
) {
  const buy = price(buyEntity);
  const sell = price(sellEntity);
  const next = price(nextEntity);
  const currency = buy?.currency || sell?.currency || next?.currency || null;
  const schedule = scheduleEntity || buyEntity;
  const scheduleUnit =
    price(schedule) || (schedule && hasState(schedule) ? price({ ...schedule, state: '0' }) : null);
  const scheduleDivisor = scheduleUnit?.currency === currency ? scheduleUnit.divisor : null;
  const records = new Map<number, { price: number; end: number }>();
  if (schedule && hasState(schedule) && scheduleDivisor !== null) {
    const { attributes } = schedule;
    const raw = [
      attributes.prices,
      attributes.prices_today,
      attributes.prices_tomorrow,
      attributes['All prices'],
    ];
    raw.forEach((list) => {
      if (!Array.isArray(list)) {
        return;
      }
      list.forEach((item) => {
        if (!isRecord(item)) {
          return;
        }
        const time = parseScheduleTime(item.time ?? item.start, timeZone);
        const value = number(item.price);
        if (
          !Number.isFinite(time) ||
          value === null ||
          // Retain the beginning of a 25-hour day when clocks move back.
          time < now - 26 * 3_600_000 ||
          time > now + 172_800_000
        ) {
          return;
        }
        if (!records.has(time)) {
          records.set(time, {
            price: value / scheduleDivisor,
            end: parseScheduleTime(item.end, timeZone),
          });
        }
      });
    });
  }
  const times = [...records.keys()].sort((a, b) => a - b).slice(0, 288);
  const slots: PriceSlot[] = times.map((time, index) => {
    const record = records.get(time)!;
    const inferred =
      times[index + 1] && times[index + 1] - time <= 3_600_000
        ? times[index + 1]
        : time + 3_600_000;
    return {
      end: Number.isFinite(record.end) && record.end > time ? record.end : inferred,
      price: record.price,
      time,
    };
  });
  const upcoming = slots.filter((slot) => slot.end > now);
  const cheapest = upcoming.reduce<PriceSlot | null>(
    (best, slot) => (!best || slot.price < best.price ? slot : best),
    null,
  );
  const nextSlot = slots.find((slot) => slot.time > now);
  const target = parseScheduleTime(nextEntity?.attributes.target_hour, timeZone);
  const validNext = next?.currency === currency && (!Number.isFinite(target) || target > now);
  const legacyNext = buy ? number(buyEntity?.attributes['Next hour']) : null;
  const cheap = buyEntity?.attributes.is_cheap ?? buyEntity?.attributes['Is cheap'];
  const expensive = buyEntity?.attributes.is_expensive ?? buyEntity?.attributes['Is expensive'];
  const values = slots.map((slot) => slot.price);
  const average = values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null;
  let status: 'unknown' | 'cheap' | 'expensive' | 'standard' = 'unknown';
  if (buy) {
    if (cheap === true) {
      status = 'cheap';
    } else if (expensive === true) {
      status = 'expensive';
    } else if (average !== null && buy.value < average && cheap !== false) {
      status = 'cheap';
    } else if (average !== null && buy.value > average && expensive !== false) {
      status = 'expensive';
    } else if (average !== null || typeof cheap === 'boolean' || typeof expensive === 'boolean') {
      status = 'standard';
    }
  }
  const day = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    timeZone: timeZone || 'UTC',
    year: 'numeric',
  });
  const today = day.format(new Date(now));
  const todayPrices = slots
    .filter((slot) => day.format(new Date(slot.time)) === today)
    .map((slot) => slot.price);
  const todayMinimum = todayPrices.length ? Math.min(...todayPrices) : null;
  const todayMaximum = todayPrices.length ? Math.max(...todayPrices) : null;
  const dailyRange =
    todayMinimum !== null && todayMaximum !== null ? todayMaximum - todayMinimum : null;
  const atDailyLow = Boolean(buy && todayMinimum !== null && buy.value <= todayMinimum + 1e-8);
  const position =
    buy && todayMinimum !== null && dailyRange !== null
      ? Math.max(0, Math.min(1, dailyRange > 0 ? (buy.value - todayMinimum) / dailyRange : 0))
      : null;
  if (buy && todayMinimum !== null && dailyRange !== null) {
    status =
      buy.value <= todayMinimum + dailyRange * 0.1 + 1e-8
        ? 'cheap'
        : dailyRange > 0 && buy.value >= todayMinimum + dailyRange * 0.75
          ? 'expensive'
          : 'standard';
  }
  return {
    atDailyLow,
    average,
    buy: buy && buy.currency === currency ? buy.value : null,
    cheap: typeof cheap === 'boolean' ? cheap : null,
    cheapest,
    currency,
    maximum: values.length ? Math.max(...values) : null,
    minimum: values.length ? Math.min(...values) : null,
    next:
      validNext && next
        ? next.value
        : legacyNext !== null && buy
          ? legacyNext / buy.divisor
          : (nextSlot?.price ?? null),
    position,
    sell: sell && sell.currency === currency ? sell.value : null,
    slots,
    status,
    todayMaximum,
    todayMinimum,
  };
}
export type EnergyReading = ReturnType<typeof mapEnergy>;
