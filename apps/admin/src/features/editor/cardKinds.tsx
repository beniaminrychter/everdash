import { cardEntityDomains } from '@everdash/contracts/config/cardDomains';
import {
  CloudSunIcon,
  ClockIcon,
  GaugeIcon,
  LightbulbIcon,
  PlugIcon,
  SparklesIcon,
  ThermometerIcon,
  ToggleRightIcon,
  ZapIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CardKind } from '@/app/draft/builder';

export interface CardKindInfo {
  kind: CardKind;
  /** Name shown on tiles and in the inspector. */
  label: string;
  /** Short line shown under the name in the Add card dialog. */
  description: string;
  /** Home Assistant domains the main entity may belong to; the first is the primary one. Empty when the card has no entity. */
  domains: readonly string[];
  icon: LucideIcon;
}

export const cardKinds: readonly CardKindInfo[] = [
  {
    kind: 'light',
    label: 'Light',
    description: 'Switch and dim a light',
    domains: cardEntityDomains('light'),
    icon: LightbulbIcon,
  },
  {
    kind: 'outlet',
    label: 'Outlet',
    description: 'Switch a smart plug',
    domains: cardEntityDomains('outlet'),
    icon: PlugIcon,
  },
  {
    kind: 'climate',
    label: 'Climate',
    description: 'Thermostat and heating',
    domains: cardEntityDomains('climate'),
    icon: ThermometerIcon,
  },
  {
    kind: 'weather',
    label: 'Weather',
    description: 'Current conditions and forecast',
    domains: cardEntityDomains('weather'),
    icon: CloudSunIcon,
  },
  {
    kind: 'clock',
    label: 'Time and date',
    description: 'This device’s own clock',
    domains: cardEntityDomains('clock'),
    icon: ClockIcon,
  },
  {
    kind: 'pstryk',
    label: 'Pstryk energy',
    description: 'Energy prices and usage',
    domains: cardEntityDomains('pstryk'),
    icon: ZapIcon,
  },
  {
    kind: 'value',
    label: 'Value',
    description: 'Show a sensor or number',
    domains: cardEntityDomains('value'),
    icon: GaugeIcon,
  },
  {
    kind: 'toggle',
    label: 'Switch',
    description: 'Toggle or show on/off',
    domains: cardEntityDomains('toggle'),
    icon: ToggleRightIcon,
  },
  {
    kind: 'scene',
    label: 'Scene',
    description: 'Run a scene or script',
    domains: cardEntityDomains('scene'),
    icon: SparklesIcon,
  },
];

export function cardKindInfo(kind: CardKind): CardKindInfo {
  return cardKinds.find((item) => item.kind === kind) ?? cardKinds[0]!;
}

/** Whether an entity ID is well formed for one of the given Home Assistant domains. */
export function isEntityForDomain(entity: string, domain: string | readonly string[]): boolean {
  const domains = typeof domain === 'string' ? [domain] : domain;

  return new RegExp(`^(?:${domains.join('|')})\\.[a-z0-9_]+$`).test(entity);
}
