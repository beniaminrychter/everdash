import {
  BedIcon,
  CheckIcon,
  ClapperboardIcon,
  CloudIcon,
  CloudRainIcon,
  CoffeeIcon,
  DoorClosedIcon,
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
  door: DoorClosedIcon,
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
  onChange: (icon: IconName | undefined) => void;
  /** Adds an "Auto" choice that clears the icon, so the tablet picks one from the device class. */
  auto?: boolean;
}

export function IconGrid({ value, label, onChange, auto = false }: IconGridProps) {
  return (
    <fieldset className="grid grid-cols-6 gap-1.5">
      <legend className="sr-only">{label}</legend>
      {auto && (
        <button
          type="button"
          aria-pressed={value === undefined}
          onClick={() => onChange(undefined)}
          className={cn(
            'focus-visible:ring-ring/50 col-span-6 h-9 rounded-md border text-sm transition-colors outline-none focus-visible:ring-[3px]',
            value === undefined
              ? 'border-primary bg-primary/10 text-foreground ring-primary ring-1'
              : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          Auto (from the entity type)
        </button>
      )}
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
