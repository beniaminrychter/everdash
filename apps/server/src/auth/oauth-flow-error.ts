import type { AuthErrorCode } from '@everdash/contracts/auth/oauth';

const messages: Record<AuthErrorCode, string> = {
  INVALID_REQUEST: 'Invalid authentication request.',
  AUTH_FAILED: 'Home Assistant authentication failed.',
  CONNECTOR_REPAIR: 'Home Assistant connection needs repair.',
  HA_UNREACHABLE: 'EverDash cannot reach Home Assistant.',
  NOT_ADMIN: 'Home Assistant user is not an administrator.',
};

export class OAuthFlowError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(messages[code]);
    this.name = 'OAuthFlowError';
  }
}
