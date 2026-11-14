import { cloneElement } from 'preact';
import type { JSX } from 'preact';
import { Icon } from '../../ui/Icon/Icon';
import type { IconName } from '../../ui/Icon/Icon';

type IconProps = Omit<JSX.SVGAttributes<SVGSVGElement>, 'size'> & { size?: number };

function configured(name: IconName) {
  return function AdminIcon({ size = 24, style, ...props }: IconProps) {
    return cloneElement(Icon({ name }), {
      ...props,
      width: size,
      height: size,
      style: { width: size, height: size, ...(typeof style === 'object' ? style : {}) },
    });
  };
}

function action(path: JSX.Element) {
  return function AdminIcon({ size = 24, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        {...props}
      >
        {path}
      </svg>
    );
  };
}

export const Bed = configured('bed');
export const Check = configured('check');
export const Cloud = configured('cloud');
export const CloudRain = configured('rain');
export const Coffee = configured('coffee');
export const Clapperboard = configured('movie');
export const Home = configured('home');
export const LampDesk = configured('desk-lamp');
export const LampFloor = configured('floor-lamp');
export const Laptop = configured('laptop');
export const Lightbulb = configured('bulb');
export const Moon = configured('moon');
export const Plug = configured('plug');
export const Settings2 = configured('sliders');
export const Share2 = configured('share');
export const Sofa = configured('sofa');
export const Sun = configured('sun');
export const Sunrise = configured('sunrise');
export const Thermometer = configured('thermometer');
export const UserRound = configured('away');
export const X = configured('close');
export const ChevronDown = action(<path d="m6 9 6 6 6-6" />);
export const CircleHelp = action(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.2-1.5 2.5M12 17h.01" />
  </>,
);
export const CloudSun = action(
  <>
    <path d="M6 19a4 4 0 0 1 0-8 6 6 0 0 1 11.5-1A4.5 4.5 0 1 1 19 19Z" />
    <path d="M12 3v2m7 0-1 1m4 4h-2" />
  </>,
);
export const Copy = action(
  <>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </>,
);
export const ExternalLink = action(<path d="M13 5h6v6m0-6-9 9M19 14v5H5V5h5" />);
export const MoreHorizontal = configured('more');
export const Plus = action(<path d="M12 5v14M5 12h14" />);
export const RotateCcw = action(<path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" />);
export const Save = action(
  <>
    <path d="M4 3h13l3 3v15H4zM7 3v6h9V3M7 21v-8h10v8" />
  </>,
);
export const Trash2 = action(<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" />);
export const Upload = action(<path d="M12 16V3m-4 4 4-4 4 4M4 16v4h16v-4" />);
export const Wifi = action(
  <>
    <path d="M2 9a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8 15a6 6 0 0 1 8 0" />
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
  </>,
);
export const Zap = action(<path d="M13 2 4 14h7l-1 8 10-12h-7z" />);
