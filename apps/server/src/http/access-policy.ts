import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ServerDependencies } from '../app';
import { apiError } from './errors';

/** Decides who may use admin (`/api/manage`) and tablet dashboard routes. */
export interface AccessPolicy {
  isAdmin: (request: FastifyRequest) => boolean;
  isTablet: (request: FastifyRequest) => boolean;
}

export function requireAdminAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  dependencies: ServerDependencies,
): boolean {
  if (dependencies.access.isAdmin(request)) {
    return true;
  }

  reply.code(401).send({ error: 'UNAUTHORIZED' });
  return false;
}

export function requireTabletAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  dependencies: ServerDependencies,
): boolean {
  if (dependencies.access.isTablet(request)) {
    return true;
  }

  reply.code(401).send(apiError('TABLET_ACCESS_REQUIRED', 'Tablet access is locked.'));
  return false;
}

export function expectedOriginFor(dependencies: ServerDependencies) {
  return (request: FastifyRequest) => dependencies.expectedOrigin?.(request) ?? null;
}
