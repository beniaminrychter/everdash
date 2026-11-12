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
}

export type AuthErrorCode = 'INVALID_REQUEST' | 'AUTH_FAILED' | 'CONNECTOR_REPAIR';
