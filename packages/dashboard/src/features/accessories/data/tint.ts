/** The accent of a light with no colour of its own; also the fallback for a malformed colour. */
export const defaultAccent = '#ffd60a';

export interface DeviceTint {
  color: string;
  /** The lit tile's tint, laid over the tile surface. */
  fill: string;
  ring: string;
  /** The icon disc of a lit tile. */
  disc: string;
  /** Glyph and status text on the light theme: the accent mixed toward black until it is readable. */
  inkLight: string;
  /** Glyph and status text on the dark theme: the accent mixed toward white until it is readable. */
  inkDark: string;
}

const hexColor = /^#[0-9a-f]{6}$/i;

/** The tile surface of each theme, which the tint is laid over (the `--surface` tokens). */
const lightSurface: readonly number[] = [255, 255, 255];
const darkSurface: readonly number[] = [40, 52, 68];

/** The tint's strength over the surface; keep in step with the alpha of `fill`. */
const fillAlpha = 0.17;

/** The text contrast the ink must reach against the lit tile as drawn (WCAG AA). */
const minContrast = 4.5;

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function rgba([r, g, b]: readonly number[], alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mixes each channel toward `target` (0 or 255) by `amount`. */
function mixChannels(values: readonly number[], target: number, amount: number): number[] {
  return values.map((value) => Math.round(value + (target - value) * amount));
}

function toHex(values: readonly number[]): string {
  return `#${values.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function luminance(values: readonly number[]): number {
  const [r, g, b] = values.map((value) => {
    const channel = value / 255;

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(first: readonly number[], second: readonly number[]): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);

  return (light! + 0.05) / (dark! + 0.05);
}

/**
 * The accent mixed toward `target` (0 or 255), starting at `from` and going further until it can be
 * read on the lit tile: the accent over `surface`.
 */
function readableInk(
  values: readonly number[],
  surface: readonly number[],
  target: number,
  from: number,
): string {
  const tile = values.map((value, index) =>
    Math.round(value * fillAlpha + surface[index]! * (1 - fillAlpha)),
  );
  let amount = from;

  while (amount < 1) {
    if (contrast(mixChannels(values, target, amount), tile) >= minContrast) {
      break;
    }

    amount = Math.min(1, amount + 0.05);
  }

  return toHex(mixChannels(values, target, amount));
}

/** The colours an accessory tile takes from its device colour, as the CSS custom properties need them. */
export function deviceTint(accent: string): DeviceTint {
  const color = hexColor.test(accent) ? accent.toLowerCase() : defaultAccent;
  const values = channels(color);

  return {
    color,
    fill: rgba(values, fillAlpha),
    ring: rgba(values, 0.45),
    disc: rgba(values, 0.26),
    inkLight: readableInk(values, lightSurface, 0, 0.45),
    inkDark: readableInk(values, darkSurface, 255, 0.35),
  };
}
