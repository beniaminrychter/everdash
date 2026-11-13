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
  durability?: 'uncertain';
  /** The saved Home Assistant address, when connected. */
  homeAssistantOrigin?: string;
}

export type AuthErrorCode =
  | 'INVALID_REQUEST'
  | 'AUTH_FAILED'
  | 'CONNECTOR_REPAIR'
  | 'HA_UNREACHABLE'
  | 'NOT_ADMIN';
