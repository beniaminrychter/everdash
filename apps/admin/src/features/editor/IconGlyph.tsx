import { createElement } from 'react';
import type { CSSProperties } from 'react';
import type { IconName } from '@everdash/contracts/iconNames';
import { iconShapes, iconSvgAttributes } from '@everdash/ui/ui/Icon/iconShapes';

/** The cutout colors some tablet glyphs read from CSS variables; here they follow the page. */
const cutouts = {
  '--movie-cutout': 'var(--background)',
  '--socket-cutout': 'var(--background)',
} as CSSProperties;

/** React attribute names for the SVG attributes the shared icon data spells in kebab case. */
function reactAttributes(attributes: Readonly<Record<string, string>>) {
  const result: Record<string, string> = {};

  for (const name of Object.keys(attributes)) {
    result[name.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())] =
      attributes[name];
  }

  return result;
}

const svgAttributes = reactAttributes(iconSvgAttributes);

/** Draws an icon from the same shape data the tablet renders, so the picker matches the dashboard. */
export function IconGlyph({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg {...svgAttributes} className={className} style={cutouts} aria-hidden="true">
      {iconShapes[name].map(([tag, attributes], index) =>
        createElement(tag, { ...reactAttributes(attributes), key: index }),
      )}
    </svg>
  );
}
