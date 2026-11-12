export const TRANSACTION_COOKIE = 'everdash_oauth';
export const ADMIN_COOKIE = 'everdash_admin';

const OPAQUE = /^[A-Za-z0-9_-]+$/;

function cookie(
  name: string,
  value: string,
  path: string,
  sameSite: string,
  secure: boolean,
  maxAge?: number,
): string {
  if (value && !OPAQUE.test(value)) {
    throw new Error('Invalid cookie value');
  }
  let result = `${name}=${value}; Path=${path}; HttpOnly; SameSite=${sameSite}`;
  if (maxAge !== undefined) {
    result += `; Max-Age=${maxAge}`;
  }
  if (secure) {
    result += '; Secure';
  }
  return result;
}

export function transactionCookie(value: string, secure: boolean): string {
  if (!value) {
    throw new Error('Invalid cookie value');
  }
  return cookie(TRANSACTION_COOKIE, value, '/api/manage/auth', 'Lax', secure, 600);
}

export function clearTransactionCookie(secure: boolean): string {
  return cookie(TRANSACTION_COOKIE, '', '/api/manage/auth', 'Lax', secure, 0);
}

export function adminCookie(value: string, secure: boolean): string {
  if (!value) {
    throw new Error('Invalid cookie value');
  }
  return cookie(ADMIN_COOKIE, value, '/api/manage', 'Strict', secure);
}

export function clearAdminCookie(secure: boolean): string {
  return cookie(ADMIN_COOKIE, '', '/api/manage', 'Strict', secure, 0);
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) {
    return null;
  }
  let found: string | null = null;
  let seen = false;
  for (const part of header.split(';')) {
    const item = part.trim();
    const separator = item.indexOf('=');
    const key = separator === -1 ? item : item.slice(0, separator).trim();
    if (key !== name) {
      continue;
    }
    if (seen) {
      return null;
    }
    seen = true;
    const value = separator === -1 ? '' : item.slice(separator + 1);
    if (!OPAQUE.test(value)) {
      return null;
    }
    found = value;
  }
  return found;
}
