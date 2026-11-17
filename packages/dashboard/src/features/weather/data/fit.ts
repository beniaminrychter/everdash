/*
 * A one-row card has no room to scroll or wrap, so how many forecast entries it shows follows the
 * width it was given: the same dashboard lays out the same way on the tablet and in the editor
 * preview at the same width. The numbers are the widths of the zones in WeatherCard.module.css.
 */

/** Width of one forecast entry in px: "15.1°C" in the entry font is about 42px. */
const entryWidth = 46;

/** Fewer entries than this are not worth a divider and a column. */
const fewestEntries = 2;

/** Space a half one-row card keeps for the conditions (px). */
const halfConditionsWidth = 150;

/** Space a full one-row card keeps for the conditions, the details and the dividers (px). */
const fullConditionsWidth = 200;
const fullDetailsWidth = 200;
const dividers = 25;

/** The most entries that fit in `width` px (all of `max` while the width is not known yet). */
export function fitEntries(width: number | undefined, max: number): number {
  if (width === undefined) {
    return max;
  }

  const fits = Math.floor(width / entryWidth);

  return fits < fewestEntries ? 0 : Math.min(fits, max);
}

export interface FullRowZones {
  details: boolean;
  entries: number;
}

/** What a full one-row card of this width shows: it drops the details before the forecast. */
export function fullRowZones(width: number | undefined): FullRowZones {
  const withDetails = fitEntries(
    width === undefined ? undefined : width - fullConditionsWidth - fullDetailsWidth - 2 * dividers,
    5,
  );

  if (width === undefined || withDetails >= 3) {
    return { details: true, entries: withDetails };
  }

  return { details: false, entries: fitEntries(width - fullConditionsWidth - dividers, 5) };
}

/** The entries a half one-row card of this width shows. */
export function halfRowEntries(width: number | undefined): number {
  return fitEntries(width === undefined ? undefined : width - halfConditionsWidth - dividers, 3);
}
