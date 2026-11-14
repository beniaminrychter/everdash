import {
  BedIcon,
  CheckIcon,
  ClapperboardIcon,
  CloudIcon,
  CloudRainIcon,
  CoffeeIcon,
  DropletIcon,
  GaugeIcon,
  HouseIcon,
  LampDeskIcon,
  LampFloorIcon,
  LaptopIcon,
  LightbulbIcon,
  MoonIcon,
  PlugIcon,
  Share2Icon,
  SlidersHorizontalIcon,
  SofaIcon,
  SparklesIcon,
  SunIcon,
  SunriseIcon,
  ThermometerIcon,
  ToggleRightIcon,
  UserRoundIcon,
  XIcon,
  EllipsisIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { iconNames } from '@everdash/contracts/iconNames';
import type { IconName } from '@everdash/contracts/iconNames';
import { cn } from '@/lib/utils';

const iconComponents: Record<IconName, LucideIcon> = {
  away: UserRoundIcon,
  bed: BedIcon,
  bulb: LightbulbIcon,
  check: CheckIcon,
  close: XIcon,
  cloud: CloudIcon,
  coffee: CoffeeIcon,
  'desk-lamp': LampDeskIcon,
  droplet: DropletIcon,
  'floor-lamp': LampFloorIcon,
  gauge: GaugeIcon,
  home: HouseIcon,
  laptop: LaptopIcon,
  moon: MoonIcon,
  more: EllipsisIcon,
  movie: ClapperboardIcon,
  outlet: PlugIcon,
  pendant: LightbulbIcon,
  plug: PlugIcon,
  rain: CloudRainIcon,
  share: Share2Icon,
  sliders: SlidersHorizontalIcon,
  sofa: SofaIcon,
  sparkle: SparklesIcon,
  sun: SunIcon,
  sunrise: SunriseIcon,
  thermometer: ThermometerIcon,
  toggle: ToggleRightIcon,
};

interface IconGridProps {
  value: IconName | undefined;
  label: string;
  onChange: (icon: IconName) => void;
}

export function IconGrid({ value, label, onChange }: IconGridProps) {
  return (
    <fieldset className="grid grid-cols-6 gap-1.5">
      <legend className="sr-only">{label}</legend>
      {iconNames.map((name) => {
        const Icon = iconComponents[name];
        const pressed = value === name;

        return (
          <button
            key={name}
            type="button"
            title={name}
            aria-label={name}
            aria-pressed={pressed}
            onClick={() => onChange(name)}
            className={cn(
              'focus-visible:ring-ring/50 grid h-9 place-items-center rounded-md border transition-colors outline-none focus-visible:ring-[3px]',
              pressed
                ? 'border-primary bg-primary/10 text-foreground ring-primary ring-1'
                : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </fieldset>
  );
}
