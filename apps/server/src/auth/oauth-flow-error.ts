export class OAuthFlowError extends Error {
  constructor(readonly code: 'INVALID_REQUEST' | 'AUTH_FAILED' | 'CONNECTOR_REPAIR') {
    super(
      code === 'INVALID_REQUEST'
        ? 'Invalid authentication request.'
        : code === 'CONNECTOR_REPAIR'
          ? 'Home Assistant connection needs repair.'
          : 'Home Assistant authentication failed.',
    );
    this.name = 'OAuthFlowError';
  }
}
