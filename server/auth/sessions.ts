import type { FastifyRequest } from 'fastify';
import type { DeviceRepository } from './devices';
import { getIngressUserId } from './ingress';

export const DEVICE_COOKIE_NAME = 'everdash_device';
export const DEVICE_SESSION_MAX_AGE = 365 * 24 * 60 * 60;

export function readDeviceCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }
  for (const item of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = item.trim().split('=');
    if (rawName === DEVICE_COOKIE_NAME) {
      return rawValue.join('=') || null;
    }
  }
  return null;
}

export function deviceCookie(session: string): string {
  return `${DEVICE_COOKIE_NAME}=${session}; Path=/; Max-Age=${DEVICE_SESSION_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`;
}

export function expiredDeviceCookie(): string {
  return `${DEVICE_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

export class DeviceSessions {
  constructor(private readonly devices: DeviceRepository) {}

  authorize(session: string | null): Promise<boolean> {
    return session ? this.devices.authorize(session) : Promise.resolve(false);
  }

  logout(session: string | null): Promise<boolean> {
    return session ? this.devices.revokeSession(session) : Promise.resolve(false);
  }
}

export function createAuthorizer(devices: DeviceRepository) {
  const sessions = new DeviceSessions(devices);
  return async (request: FastifyRequest, mode: 'management' | 'direct'): Promise<boolean> => {
    if (mode === 'management') {
      return (
        getIngressUserId({
          headers: request.headers,
          socket: { remoteAddress: request.raw.socket.remoteAddress },
        }) !== null
      );
    }
    return sessions.authorize(readDeviceCookie(request.headers.cookie));
  };
}
