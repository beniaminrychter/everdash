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
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import type { CardKind } from '@/app/draft/builder';

export interface CardKindInfo {
  kind: CardKind;
  /** Name shown on tiles and in the inspector. */
  label: string;
  /** Short line shown under the name in the Add card dialog. */
  description?: string;
  /** Home Assistant domains the main entity may belong to; the first is the primary one. Empty when the card has no entity. */
  domains: readonly string[];
  icon: LucideIcon;
}

const cardKindDefs: readonly {
  kind: CardKind;
  label: () => string;
  description?: () => string;
  domains: readonly string[];
  icon: LucideIcon;
}[] = [
  {
    kind: 'light',
    label: () => m.admin_card_kind_light_label(),
    description: () => m.admin_card_kind_light_desc(),
    domains: cardEntityDomains('light'),
    icon: LightbulbIcon,
  },
  {
    kind: 'outlet',
    label: () => m.admin_card_kind_outlet_label(),
    description: () => m.admin_card_kind_outlet_desc(),
    domains: cardEntityDomains('outlet'),
    icon: PlugIcon,
  },
  {
    kind: 'climate',
    label: () => m.admin_card_kind_climate_label(),
    description: () => m.admin_card_kind_climate_desc(),
    domains: cardEntityDomains('climate'),
    icon: ThermometerIcon,
  },
  {
    kind: 'weather',
    label: () => m.admin_card_kind_weather_label(),
    domains: cardEntityDomains('weather'),
    icon: CloudSunIcon,
  },
  {
    kind: 'clock',
    label: () => m.admin_card_kind_clock_label(),
    description: () => m.admin_card_kind_clock_desc(),
    domains: cardEntityDomains('clock'),
    icon: ClockIcon,
  },
  {
    kind: 'pstryk',
    label: () => m.admin_card_kind_pstryk_label(),
    description: () => m.admin_card_kind_pstryk_desc(),
    domains: cardEntityDomains('pstryk'),
    icon: ZapIcon,
  },
  {
    kind: 'value',
    label: () => m.admin_card_kind_value_label(),
    description: () => m.admin_card_kind_value_desc(),
    domains: cardEntityDomains('value'),
    icon: GaugeIcon,
  },
  {
    kind: 'toggle',
    label: () => m.admin_card_kind_toggle_label(),
    description: () => m.admin_card_kind_toggle_desc(),
    domains: cardEntityDomains('toggle'),
    icon: ToggleRightIcon,
  },
  {
    kind: 'scene',
    label: () => m.admin_card_kind_scene_label(),
    description: () => m.admin_card_kind_scene_desc(),
    domains: cardEntityDomains('scene'),
    icon: SparklesIcon,
  },
];

export function getCardKinds(): CardKindInfo[] {
  return cardKindDefs.map((item) => ({
    kind: item.kind,
    label: item.label(),
    description: item.description?.(),
    domains: item.domains,
    icon: item.icon,
  }));
}

export function cardKindInfo(kind: CardKind): CardKindInfo {
  const item = cardKindDefs.find((candidate) => candidate.kind === kind) ?? cardKindDefs[0]!;

  return {
    kind: item.kind,
    label: item.label(),
    description: item.description?.(),
    domains: item.domains,
    icon: item.icon,
  };
}

/** Whether an entity ID is well formed for one of the given Home Assistant domains. */
export function isEntityForDomain(entity: string, domain: string | readonly string[]): boolean {
  const domains = typeof domain === 'string' ? [domain] : domain;

  return new RegExp(`^(?:${domains.join('|')})\\.[a-z0-9_]+$`).test(entity);
}
