import type { ConfigIssue } from '../../src/shared/config/validate';

export class ConfigRepositoryError extends Error {
  readonly code: 'CONFIG_CONFLICT' | 'CONFIG_INVALID' | 'CONFIG_RECOVERY_REQUIRED';
  readonly issues?: ConfigIssue[];

  constructor(
    message: string,
    code: 'CONFIG_CONFLICT' | 'CONFIG_INVALID' | 'CONFIG_RECOVERY_REQUIRED',
    issues?: ConfigIssue[],
  ) {
    super(message);
    this.name = 'ConfigRepositoryError';
    this.code = code;
    this.issues = issues;
  }
}
