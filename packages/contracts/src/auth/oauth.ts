export interface AuthStartRequest {
  intent: 'login' | 'reconnect';
  homeAssistantOrigin?: string;
}

export interface AuthStartResponse {
  authorizationUrl: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  connection: 'unconfigured' | 'connected' | 'repair-required';
  connectionMode?: 'oauth' | 'supervisor';
  durability?: 'uncertain';
  /** The saved Home Assistant address, when connected. */
  homeAssistantOrigin?: string;
  /** True when served through Home Assistant Ingress. */
  ingress?: boolean;
  /** Direct HTTP port serving the tablet dashboard, when served over Ingress. */
  tabletPort?: number;
  /** Language configured in Home Assistant (for example `en` or `pl`), when available. */
  language?: string;
}

export type DiscoverySource = 'mdns' | 'network' | 'local';

export interface DiscoveredHomeAssistant {
  /** Preferred reachable URL for this Home Assistant instance. */
  origin: string;
  /** All reachable URLs discovered for this Home Assistant instance, in preference order. */
  origins?: string[];
  name?: string;
  version?: string;
  source: DiscoverySource;
}

export interface AuthDiscoverResponse {
  instances: DiscoveredHomeAssistant[];
}

export type AuthErrorCode =
  | 'INVALID_REQUEST'
  | 'AUTH_FAILED'
  | 'CONNECTOR_REPAIR'
  | 'HA_UNREACHABLE'
  | 'NOT_ADMIN';
