import type { AuthErrorCode } from '@everdash/contracts/auth/oauth';

const messages: Record<AuthErrorCode, string> = {
  HA_UNREACHABLE:
    'The EverDash server cannot reach Home Assistant at that address. If EverDash runs in a container, localhost points at the container itself. Use your Home Assistant LAN address instead, for example http://192.168.1.10:8123.',
  NOT_ADMIN:
    'That Home Assistant user is not an administrator. Sign in with an administrator account.',
  AUTH_FAILED: 'Home Assistant login could not be completed. Please try again.',
  INVALID_REQUEST:
    'The login request was not valid or has expired. Check the address and try again.',
  CONNECTOR_REPAIR: 'The Home Assistant connection needs repair. Sign in again to reconnect.',
};

export function authErrorMessage(code: string | null | undefined): string {
  if (code && code in messages) {
    return messages[code as AuthErrorCode];
  }

  return messages.AUTH_FAILED;
}

/** Reads and removes `auth_error` so a reload does not repeat a stale message. */
export function takeAuthErrorFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('auth_error')) {
    return '';
  }

  const code = params.get('auth_error');
  params.delete('auth_error');
  const query = params.toString();
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
  );

  return authErrorMessage(code);
}
