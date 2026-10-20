import { isIP } from 'node:net';
import type { FastifyRequest } from 'fastify';

function isLoopback(address: string | undefined): boolean {
  if (!address) {
    return false;
  }
  if (address === '::1') {
    return true;
  }
  if (address.toLowerCase().startsWith('::ffff:')) {
    return isLoopback(address.slice('::ffff:'.length));
  }
  if (isIP(address) === 4) {
    return address.startsWith('127.');
  }
  return false;
}

export function createLocalManagementAuthorizer(request: FastifyRequest): boolean {
  return isLoopback(request.raw.socket.remoteAddress);
}
