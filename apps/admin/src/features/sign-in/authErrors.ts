import type { AuthErrorCode } from '@everdash/contracts/auth/oauth';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';

export function authErrorMessage(code: string | null | undefined): string {
  switch (code as AuthErrorCode | undefined) {
    case 'HA_UNREACHABLE': {
      return m.admin_auth_ha_unreachable();
    }

    case 'NOT_ADMIN': {
      return m.admin_auth_not_admin();
    }

    case 'INVALID_REQUEST': {
      return m.admin_auth_invalid_request();
    }

    case 'CONNECTOR_REPAIR': {
      return m.admin_auth_connector_repair();
    }

    default: {
      return m.admin_auth_failed();
    }
  }
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
