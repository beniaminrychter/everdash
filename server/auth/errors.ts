export class PairingError extends Error {
  readonly code:
    | 'RATE_LIMITED'
    | 'PAIRING_CAPACITY'
    | 'PAIRING_NOT_FOUND'
    | 'PAIRING_POLL_DENIED'
    | 'PAIRING_REDEEMED'
    | 'PAIRING_LABEL_INVALID';
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    code:
      | 'RATE_LIMITED'
      | 'PAIRING_CAPACITY'
      | 'PAIRING_NOT_FOUND'
      | 'PAIRING_POLL_DENIED'
      | 'PAIRING_REDEEMED'
      | 'PAIRING_LABEL_INVALID',
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'PairingError';
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
