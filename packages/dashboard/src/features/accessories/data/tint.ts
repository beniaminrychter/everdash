/** The accent of a light with no colour of its own; also the fallback for a malformed colour. */
export const defaultAccent = '#ffd60a';

export interface DeviceTint {
  color: string;
  /** The lit tile's tint, laid over the tile surface. */
  fill: string;
  ring: string;
  /** The icon disc of a lit tile. */
  disc: string;
  /** Glyph and status text on the light theme: the accent mixed toward black. */
  inkLight: string;
  /** Glyph and status text on the dark theme: the accent mixed toward white. */
  inkDark: string;
}

const hexColor = /^#[0-9a-f]{6}$/i;

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

/** Mixes each channel toward `target` (0 or 255) by `amount`, as `#rrggbb`. */
function mix(values: readonly number[], target: number, amount: number): string {
  const hex = values.map((value) =>
    Math.round(value + (target - value) * amount)
      .toString(16)
      .padStart(2, '0'),
  );

  return `#${hex.join('')}`;
}

/** The colours an accessory tile takes from its device colour, as the CSS custom properties need them. */
export function deviceTint(accent: string): DeviceTint {
  const color = hexColor.test(accent) ? accent.toLowerCase() : defaultAccent;
  const values = channels(color);

  return {
    color,
    fill: rgba(values, 0.17),
    ring: rgba(values, 0.45),
    disc: rgba(values, 0.26),
    inkLight: mix(values, 0, 0.45),
    inkDark: mix(values, 255, 0.35),
  };
}
