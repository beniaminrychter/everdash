import { CloudSunIcon, LightbulbIcon, PlugIcon, ThermometerIcon, ZapIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CardKind } from '@/app/draft/builder';

export interface CardKindInfo {
  kind: CardKind;
  /** Name shown on tiles and in the inspector. */
  label: string;
  /** Short line shown under the name in the Add card dialog. */
  description: string;
  /** Home Assistant domain the main entity must belong to. */
  domain: string;
  icon: LucideIcon;
}

export const cardKinds: readonly CardKindInfo[] = [
  {
    kind: 'light',
    label: 'Light',
    description: 'Switch and dim a light',
    domain: 'light',
    icon: LightbulbIcon,
  },
  {
    kind: 'outlet',
    label: 'Outlet',
    description: 'Switch a smart plug',
    domain: 'switch',
    icon: PlugIcon,
  },
  {
    kind: 'climate',
    label: 'Climate',
    description: 'Thermostat and heating',
    domain: 'climate',
    icon: ThermometerIcon,
  },
  {
    kind: 'weather',
    label: 'Weather',
    description: 'Current conditions and forecast',
    domain: 'weather',
    icon: CloudSunIcon,
  },
  {
    kind: 'pstryk',
    label: 'Pstryk energy',
    description: 'Energy prices and usage',
    domain: 'sensor',
    icon: ZapIcon,
  },
];

export function cardKindInfo(kind: CardKind): CardKindInfo {
  return cardKinds.find((item) => item.kind === kind) ?? cardKinds[0]!;
}

/** Whether an entity ID is well formed for the given Home Assistant domain. */
export function isEntityForDomain(entity: string, domain: string): boolean {
  return new RegExp(`^${domain}\\.[a-z0-9_]+$`).test(entity);
}
